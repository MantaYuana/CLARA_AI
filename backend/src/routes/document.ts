/**
 * document.ts
 * POST /api/v1/document/analyze       – enqueue async analysis job → 202
 * GET  /api/v1/document/analyze/:jobId/status – poll job status
 *
 * @swagger
 * tags:
 *   name: Document
 *   description: Document ingestion (OCR + guardrail) via background queue
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { analysisQueue } from "../queues/analysisQueue";
import { success, error as apiError } from "../utils/response";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE_MB ?? "10") * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/tiff",
            "image/bmp",
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    `Unsupported file type: ${file.mimetype}. Allowed: PDF, JPEG, PNG, WebP, TIFF, BMP.`,
                ),
            );
        }
    },
});

/**
 * @swagger
 * /api/v1/document/analyze:
 *   post:
 *     summary: Enqueue document for async OCR + guardrail analysis
 *     tags: [Document]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Job queued successfully
 *       400:
 *         description: No file provided
 */
router.post(
    "/analyze",
    upload.single("file"),
    async (req: Request, res: Response): Promise<void> => {
        if (!req.file) {
            res.status(400).json(apiError("MISSING_FILE", 'A file upload is required. Send a PDF or image as multipart/form-data field "file".'));
            return;
        }

        const documentId = uuidv4();
        const userId = (req as Request & { user?: { userId: string } }).user?.userId ?? "anonymous";

        try {
            const job = await analysisQueue.add("analyze", {
                documentId,
                userId,
                bufferBase64: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            });

            res.status(202).json(
                success({ job_id: job.id, document_id: documentId, status: "queued" }),
            );
        } catch (err: unknown) {
            console.error("[document/analyze]", err);
            const message = err instanceof Error ? err.message : "Internal server error";
            res.status(500).json(apiError("QUEUE_ERROR", message));
        }
    },
);

/**
 * @swagger
 * /api/v1/document/analyze/{jobId}/status:
 *   get:
 *     summary: Poll analysis job status
 *     tags: [Document]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status and optional result
 *       404:
 *         description: Job not found
 */
router.get(
    "/analyze/:jobId/status",
    async (req: Request, res: Response): Promise<void> => {
        try {
            const jobId = req.params.jobId;
            const job = await analysisQueue.getJob(jobId);
            if (!job) {
                res.status(404).json(apiError("JOB_NOT_FOUND", `Job ${jobId} not found.`));
                return;
            }

            const state = await job.getState();

            if (state === "completed") {
                res.json(success({ status: "completed", result: job.returnvalue }));
            } else if (state === "failed") {
                res.json(success({ status: "failed", reason: job.failedReason }));
            } else {
                res.json(success({ status: state, progress: job.progress }));
            }
        } catch (err: unknown) {
            console.error("[document/status]", err);
            const message = err instanceof Error ? err.message : "Internal server error";
            res.status(500).json(apiError("STATUS_ERROR", message));
        }
    },
);

export default router;
