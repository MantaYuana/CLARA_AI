/**
 * document.ts
 * POST /api/v1/document/analyze
 *
 * Pure document ingestion endpoint — separate from the reasoning pipeline.
 * Accepts a PDF or image upload, runs OCR + guardrail checks, stores contract
 * clauses in Neo4j, and returns structured results. No LLM reasoning is
 * performed here; keep latency low and allow callers to follow up via
 * POST /api/v1/query with the returned document_id.
 *
 * Accepts:
 *   multipart/form-data:
 *     file     – PDF or image (required)
 *     question – optional free-text (not used in analysis; stored for later)
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { processUploadedFile } from "../services/ocr/ocrService";
import { embedText } from "../services/embedding/embeddingService";
import { runGuardrailChecks } from "../services/guardrail/guardrailService";
import { getSession } from "../config/neo4j";
import { TaskType } from "@google/generative-ai";

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

// ── Clause storage helper ─────────────────────────────────────────────────────

async function storeClauses(
    documentId: string,
    clauses: Awaited<ReturnType<typeof processUploadedFile>>["clauses"],
): Promise<void> {
    const session = await getSession();
    try {
        for (const clause of clauses) {
            let embedding: number[] = [];
            try {
                embedding = await embedText(
                    clause.content || clause.header,
                    TaskType.RETRIEVAL_DOCUMENT,
                );
            } catch {
                // Embedding failure doesn't block storage
            }

            await session.run(
                `
        MERGE (cc:ContractClause { id: $id })
        SET cc.document_id = $documentId,
            cc.index       = $index,
            cc.header      = $header,
            cc.content     = $content,
            cc.embedding   = $embedding,
            cc.created_at  = datetime()
        `,
                {
                    id: `${documentId}-${clause.index}`,
                    documentId,
                    index: clause.index,
                    header: clause.header,
                    content: clause.content,
                    embedding,
                },
            );
        }
    } finally {
        await session.close();
    }
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/document/analyze
 * Returns:
 * {
 *   document_id: string,        – UUID to use in subsequent /query calls
 *   raw_text: string,           – corrected OCR output
 *   language: "id",
 *   clauses: [{                 – segmented contract sections
 *     index, header, content_preview, pasal_references
 *   }],
 *   guardrail: {
 *     is_safe: boolean,
 *     critical_violations: GuardrailCheck[],
 *     warning_count: number,
 *     extracted_variables: NumericVariables,
 *     all_checks: GuardrailCheck[]
 *   }
 * }
 */
router.post(
    "/analyze",
    upload.single("file"),
    async (req: Request, res: Response): Promise<void> => {
        if (!req.file) {
            res.status(400).json({
                error:
                    'A file upload is required. Send a PDF or image as multipart/form-data field "file".',
            });
            return;
        }

        const documentId = uuidv4();

        try {
            // Run OCR and guardrail in parallel where possible
            // OCR must complete first so guardrail has the text
            const ocrResult = await processUploadedFile(
                req.file.buffer,
                req.file.mimetype,
            );

            const guardrail = await runGuardrailChecks(ocrResult.raw_text);

            // Store clauses in background — non-blocking for response latency
            storeClauses(documentId, ocrResult.clauses).catch((err) =>
                console.warn("[document/analyze] Clause storage warning:", err?.message),
            );

            res.json({
                document_id: documentId,
                raw_text: ocrResult.raw_text,
                language: ocrResult.language,
                page_count: ocrResult.page_count ?? null,
                clauses: ocrResult.clauses.map((c) => ({
                    index: c.index,
                    header: c.header,
                    content_preview: c.content_preview,
                    pasal_references: c.pasal_references,
                })),
                guardrail: {
                    is_safe: guardrail.is_safe,
                    critical_violations: guardrail.critical_violations,
                    warning_count: guardrail.warning_count,
                    extracted_variables: guardrail.extracted_variables,
                    all_checks: guardrail.checks,
                },
            });
        } catch (err: unknown) {
            console.error("[document/analyze]", err);
            const message =
                err instanceof Error ? err.message : "Internal server error";
            res.status(500).json({ error: message });
        }
    },
);

export default router;
