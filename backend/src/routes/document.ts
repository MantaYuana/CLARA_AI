/**
 * document.ts
 * POST /api/v1/document/analyze       – Upload, OCR, store Document node (with base64) + clauses in Neo4j
 * GET  /api/v1/document/:documentId   – Fetch stored document metadata + clauses by ID
 * GET  /api/v1/document/analyze/:jobId/status – Poll async job status (when Redis available)
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

//   Helpers     ─

async function saveDocumentNode(
    documentId: string,
    userId: string,
    filename: string,
    mimeType: string,
    fileBase64: string,
    rawText: string,
    pageCount: number | null,
    clauseCount: number,
): Promise<void> {
    const session = await getSession();
    try {
        await session.run(
            `
      MERGE (d:Document { id: $id })
      SET d.user_id      = $userId,
          d.filename     = $filename,
          d.mime_type    = $mimeType,
          d.file_base64  = $fileBase64,
          d.raw_text     = $rawText,
          d.page_count   = $pageCount,
          d.clause_count = $clauseCount,
          d.created_at   = datetime()
      `,
            { id: documentId, userId, filename, mimeType, fileBase64, rawText, pageCount, clauseCount },
        );
    } finally {
        await session.close();
    }
}

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
        WITH cc
        MATCH (d:Document { id: $documentId })
        MERGE (cc)-[:PART_OF]->(d)
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

//   POST /api/v1/document/analyze    

/**
 * @swagger
 * /api/v1/document/analyze:
 *   post:
 *     summary: Upload a contract document for OCR, clause extraction, and Neo4j storage
 *     description: |
 *       Upload a contract image or PDF for OCR processing, clause extraction,
 *       embedding generation, and storage in Neo4j.
 *
 *       The original file is saved as **base64** inside a `Document` node in Neo4j,
 *       so it can be retrieved later via `GET /api/v1/document/{documentId}`.
 *
 *       The returned `document_id` can be used in `POST /api/v1/query` for
 *       document-scoped legal Q&A.
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
 *                 document_id:
 *                   type: string
 *                   format: uuid
 *                 filename:
 *                   type: string
 *                   example: perjanjian_kerjasama.pdf
 *                 page_count:
 *                   type: integer
 *                   example: 3
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
 *                       content_preview:
 *                         type: string
 *                       pasal_references:
 *                         type: array
 *                         items:
 *                           type: string
 *                 embedding_status:
 *                   type: string
 *                   enum: [stored, partial, failed]
 *                 stored_clause_ids:
 *                   type: array
 *                   items:
 *                     type: string
 *                 guardrail:
 *                   type: object
 *       400:
 *         description: No file provided, or unsupported file type
 *       500:
 *         description: OCR failure or storage error
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
        const filename = req.file.originalname ?? `document-${documentId}`;
        const fileBase64 = req.file.buffer.toString("base64");

        try {
            const ocrResult = await processUploadedFile(req.file.buffer, req.file.mimetype);
            const guardrail = await runGuardrailChecks(ocrResult.raw_text);

            // 1. Save Document node with base64 file (persistent storage)
            let docSaved = false;
            try {
                await saveDocumentNode(
                    documentId,
                    userId,
                    filename,
                    req.file.mimetype,
                    fileBase64,
                    ocrResult.raw_text,
                    ocrResult.page_count ?? null,
                    ocrResult.clauses.length,
                );
                docSaved = true;
            } catch (err) {
                console.warn("[document/analyze] Document node save failed:", (err as Error).message);
            }

            // 2. Store clauses and link them to the Document node
            let storedClauseIds: string[] = [];
            let embeddingStatus: "stored" | "partial" | "failed" = "stored";
            try {
                storedClauseIds = await storeClauses(documentId, userId, ocrResult.clauses);
            } catch (err) {
                console.warn("[document/analyze] Clause storage failed:", (err as Error).message);
                embeddingStatus = "failed";
            }

            if (storedClauseIds.length > 0 && storedClauseIds.length < ocrResult.clauses.length) {
                embeddingStatus = "partial";
            }

            res.json(success({
                document_id: documentId,
                filename,
                raw_text: ocrResult.raw_text,
                language: ocrResult.language ?? "id",
                page_count: ocrResult.page_count ?? null,
                clause_count: ocrResult.clauses.length,
                clauses: ocrResult.clauses.map((c) => ({
                    index: c.index,
                    header: c.header,
                    content_preview: c.content_preview,
                    pasal_references: c.pasal_references,
                })),
                embedding_status: embeddingStatus,
                stored_clause_ids: storedClauseIds,
                document_saved: docSaved,  // true = file base64 is stored in Neo4j
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

//   GET /api/v1/document/:documentId     ─

/**
 * @swagger
 * /api/v1/document/{documentId}:
 *   get:
 *     summary: Retrieve a stored document (metadata + clauses + original file as base64)
 *     tags: [Document]
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document_id:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 mime_type:
 *                   type: string
 *                 page_count:
 *                   type: integer
 *                 clause_count:
 *                   type: integer
 *                 file_base64:
 *                   type: string
 *                   description: Original file encoded as base64
 *                 clauses:
 *                   type: array
 *       404:
 *         description: Document not found
 */
router.get(
    "/:documentId",
    async (req: Request, res: Response): Promise<void> => {
        const { documentId } = req.params;
        const session = await getSession();

        try {
            // Fetch Document node + all linked clauses
            const result = await session.run(
                `
        MATCH (d:Document { id: $documentId })
        OPTIONAL MATCH (cc:ContractClause)-[:PART_OF]->(d)
        WITH d, cc ORDER BY cc.index ASC
        WITH d, collect({
          id:              cc.id,
          index:           cc.index,
          header:          cc.header,
          content_preview: substring(coalesce(cc.content, ''), 0, 200)
        }) AS clauses
        RETURN d, clauses
        `,
                { documentId },
            );

            if (result.records.length === 0) {
                res.status(404).json(apiError("NOT_FOUND", `Document "${documentId}" not found. Make sure it was uploaded via POST /api/v1/document/analyze.`));
                return;
            }

            const record = result.records[0];
            const doc = record.get("d").properties;
            const clauses = record.get("clauses") as Array<Record<string, unknown>>;

            res.json(success({
                document_id: doc.id as string,
                filename: doc.filename as string,
                mime_type: doc.mime_type as string,
                page_count: doc.page_count as number | null,
                clause_count: doc.clause_count as number,
                raw_text: doc.raw_text as string,
                file_base64: doc.file_base64 as string,
                created_at: doc.created_at as string,
                clauses: clauses
                    .filter((c) => c.id !== null)
                    .sort((a, b) => (a.index as number) - (b.index as number))
                    .map((c) => ({
                        id: c.id,
                        index: c.index,
                        header: c.header,
                        content_preview: c.content_preview ?? (c.content as string)?.slice(0, 200),
                    })),
            }));
        } catch (err: unknown) {
            console.error("[document/get]", err);
            const message = err instanceof Error ? err.message : "Internal server error";
            res.status(500).json(apiError("INTERNAL", message));
        } finally {
            await session.close();
        }
    },
);

//   GET /api/v1/document/analyze/:jobId/status   

/**
 * @swagger
 * /api/v1/document/analyze/{jobId}/status:
 *   get:
 *     summary: Poll the status of an async document analysis job
 *     tags: [Document]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current job state
 *       404:
 *         description: Job not found
 */
router.get(
    "/analyze/:jobId/status",
    async (req: Request, res: Response): Promise<void> => {
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
            res.status(503).json(apiError("QUEUE_UNAVAILABLE", "Job queue is not available. Make sure Redis is running."));
        }
    },
);

//   GET /api/v1/document/user  

/**
 * @swagger
 * /api/v1/document/user:
 *   get:
 *     summary: Get all documents and drafter projects for the current user
 *     description: Retrieve a combined history of uploaded contract documents and active/completed drafter sessions for the logged-in user.
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user projects and documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       type:
 *                         type: string
 *                         enum: [review, draft]
 *       401:
 *         description: Unauthorized
 */
router.get("/user", async (req: Request, res: Response): Promise<void> => {
    // Note: requires auth middleware to be active on /api/v1/document in index.ts
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;

    if (!userId || userId === "anonymous") {
        res.status(401).json(apiError("UNAUTHORIZED", "You must be logged in to view your documents."));
        return;
    }

    const session = await getSession();
    try {
        const docResult = await session.run(
            `
            MATCH (d:Document { user_id: $userId })
            RETURN d.id AS id, 
                   d.filename AS title, 
                   d.created_at AS created_at,
                   "review" AS type
            ORDER BY d.created_at DESC
            `,
            { userId }
        );

        const draftResult = await session.run(
            `
            MATCH (ds:DrafterSession { user_id: $userId })
            RETURN ds.id AS id, 
                   COALESCE(ds.fields.party_a_name, "Draft") + " - " + ds.document_type AS title,
                   ds.updated_at AS created_at,
                   "draft" AS type
            ORDER BY ds.updated_at DESC
            `,
            { userId }
        );

        const documents = docResult.records.map((r) => ({
            id: r.get("id"),
            title: r.get("title"),
            created_at: r.get("created_at")?.toString() || new Date().toISOString(),
            type: r.get("type"),
        }));

        const drafts = draftResult.records.map((r) => ({
            id: r.get("id"),
            title: r.get("title"),
            created_at: r.get("created_at")?.toString() || new Date().toISOString(),
            type: r.get("type"),
        }));

        // Combine and sort by date descending
        const history = [...documents, ...drafts].sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        res.json(success(history));
    } catch (err: unknown) {
        console.error("[document/user]", err);
        const message = err instanceof Error ? err.message : "Internal server error";
        res.status(500).json(apiError("INTERNAL", message));
    } finally {
        await session.close();
    }
});

export default router;
