/**
 * document.ts
 * POST /api/v1/document/analyze       – Upload contract file for OCR, clause extraction & Neo4j storage
 * GET  /api/v1/document/analyze/:jobId/status – Poll async job status
 *
 * @swagger
 * tags:
 *   name: Document
 *   description: Contract document ingestion – OCR, clause extraction, embedding, and Neo4j storage
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { processUploadedFile } from "../services/ocr/ocrService";
import { embedText } from "../services/embedding/embeddingService";
import { runGuardrailChecks } from "../services/guardrail/guardrailService";
import { getSession } from "../config/neo4j";
import { TaskType } from "@google/generative-ai";
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
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, JPEG, PNG, WebP, TIFF, BMP.`));
        }
    },
});

// ── Clause storage helper ─────────────────────────────────────────────────────

async function storeClauses(
    documentId: string,
    userId: string,
    clauses: Awaited<ReturnType<typeof processUploadedFile>>["clauses"],
): Promise<string[]> {
    const session = await getSession();
    const storedIds: string[] = [];
    try {
        for (const clause of clauses) {
            let embedding: number[] = [];
            try {
                embedding = await embedText(clause.content || clause.header, TaskType.RETRIEVAL_DOCUMENT);
            } catch {
                // Embedding failure doesn't block storage
            }

            const clauseId = `${documentId}-${clause.index}`;
            await session.run(
                `
        MERGE (cc:ContractClause { id: $id })
        SET cc.document_id = $documentId,
            cc.user_id     = $userId,
            cc.index       = $index,
            cc.header      = $header,
            cc.content     = $content,
            cc.embedding   = $embedding,
            cc.created_at  = datetime()
        `,
                {
                    id: clauseId,
                    documentId,
                    userId,
                    index: clause.index,
                    header: clause.header,
                    content: clause.content,
                    embedding,
                },
            );
            storedIds.push(clauseId);
        }
    } finally {
        await session.close();
    }
    return storedIds;
}

// ── POST /api/v1/document/analyze ─────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/document/analyze:
 *   post:
 *     summary: Upload a contract document for OCR, clause extraction, and Neo4j storage
 *     description: |
 *       Upload a contract image or PDF for OCR processing, clause extraction,
 *       embedding generation, and storage in Neo4j.
 *
 *       **Pipeline:** File upload → OCR (Google Vision) → Clause segmentation →
 *       Guardrail checks → Embedding generation → Neo4j storage.
 *
 *       The returned `document_id` can be used in subsequent `POST /api/v1/query`
 *       or `POST /api/v1/contract/review` calls.
 *     tags: [Document]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Image (JPEG/PNG/WebP/TIFF/BMP) or PDF — max 10 MB"
 *     responses:
 *       200:
 *         description: Document successfully processed and stored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 filename:
 *                   type: string
 *                   example: perjanjian_kerjasama.pdf
 *                 page_count:
 *                   type: integer
 *                   example: 3
 *                 ocr_confidence:
 *                   type: number
 *                   example: 0.97
 *                 clause_count:
 *                   type: integer
 *                   example: 8
 *                 clauses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                       header:
 *                         type: string
 *                         example: "Pasal 1"
 *                       content_preview:
 *                         type: string
 *                         example: "Para pihak sepakat untuk..."
 *                       pasal_references:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Pasal 1320", "Pasal 1338"]
 *                 embedding_status:
 *                   type: string
 *                   enum: [stored, partial, failed]
 *                   example: stored
 *                 stored_clause_ids:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["contract-clause-1708825200000-0", "contract-clause-1708825200000-1"]
 *                 guardrail:
 *                   type: object
 *                   properties:
 *                     is_safe:
 *                       type: boolean
 *                     warning_count:
 *                       type: integer
 *                     critical_violations:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: No file provided, or unsupported file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: string
 *                   example: MISSING_FILE
 *                 message:
 *                   type: string
 *       500:
 *         description: OCR failure or embedding/Neo4j storage error
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
            const ocrResult = await processUploadedFile(req.file.buffer, req.file.mimetype);
            const guardrail = await runGuardrailChecks(ocrResult.raw_text);

            // Store clauses and collect their IDs (best-effort, non-blocking failure)
            let storedClauseIds: string[] = [];
            let embeddingStatus: "stored" | "partial" | "failed" = "stored";
            try {
                storedClauseIds = await storeClauses(documentId, userId, ocrResult.clauses);
            } catch {
                embeddingStatus = "failed";
            }

            res.json(success({
                success: true,
                document_id: documentId,
                filename: req.file.originalname ?? null,
                raw_text: ocrResult.raw_text,
                language: ocrResult.language ?? "id",
                page_count: ocrResult.page_count ?? null,
                ocr_confidence: null, // not available from current OCR service
                clause_count: ocrResult.clauses.length,
                clauses: ocrResult.clauses.map((c) => ({
                    index: c.index,
                    header: c.header,
                    content_preview: c.content_preview,
                    pasal_references: c.pasal_references,
                })),
                embedding_status: embeddingStatus,
                stored_clause_ids: storedClauseIds,
                guardrail: {
                    is_safe: guardrail.is_safe,
                    warning_count: guardrail.warning_count,
                    critical_violations: guardrail.critical_violations,
                    extracted_variables: guardrail.extracted_variables,
                    all_checks: guardrail.checks,
                },
            }));
        } catch (err: unknown) {
            console.error("[document/analyze]", err);
            const message = err instanceof Error ? err.message : "Internal server error";
            res.status(500).json(apiError("ANALYSIS_ERROR", message));
        }
    },
);

// ── GET /api/v1/document/analyze/:jobId/status ────────────────────────────────

/**
 * @swagger
 * /api/v1/document/analyze/{jobId}/status:
 *   get:
 *     summary: Poll the status of an async document analysis job
 *     description: |
 *       When the queue-based pipeline is active, use this endpoint to check
 *       whether an enqueued `document-analysis` job has completed.
 *     tags: [Document]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID returned by the POST /analyze endpoint
 *     responses:
 *       200:
 *         description: Current job state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [waiting, active, completed, failed]
 *                 result:
 *                   type: object
 *                   description: Present when status is "completed"
 *                 reason:
 *                   type: string
 *                   description: Present when status is "failed"
 *       404:
 *         description: Job not found
 */
router.get(
    "/analyze/:jobId/status",
    async (req: Request, res: Response): Promise<void> => {
        // Queue-based status polling (requires Redis + BullMQ worker running)
        try {
            const { analysisQueue } = await import("../queues/analysisQueue");
            const jobId = req.params.jobId;
            const job = await analysisQueue.getJob(String(jobId));
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
        } catch {
            // Queue not available (Redis offline) – graceful degradation
            res.status(503).json(apiError("QUEUE_UNAVAILABLE", "Job queue is not available. Make sure Redis is running."));
        }
    },
);

export default router;
