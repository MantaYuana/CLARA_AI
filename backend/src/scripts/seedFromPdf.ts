/**
 * seedFromPdf.ts
 * Seeds a custom PDF document into the Neo4j Legal Knowledge Graph
 *
 * Usage:
 *   npm run seed:pdf -- --file=/path/to/document.pdf --law-id=MY-LAW-001 --law-title="Judul Dokumen"
 */
import * as fs from "fs";
import * as path from "path";
import { getDriver, closeDriver, verifyConnectivity } from "../config/neo4j";
import { extractTextFromPdf } from "../services/ocr/ocrService";
import { segmentClauses } from "../services/ocr/ocrService";
import { embedText } from "../services/embedding/embeddingService";

// CLI argument parsing
function parseArgs(): { file: string; lawId: string; lawTitle: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined =>
    args
      .find((a) => a.startsWith(`--${flag}=`))
      ?.split("=")
      .slice(1)
      .join("=");

  const file = get("file");
  if (!file) {
    console.error("Missing required argument: --file=/path/to/document.pdf");
    process.exit(1);
  }

  const absFile = path.resolve(file);
  if (!fs.existsSync(absFile)) {
    console.error(`File not found: ${absFile}`);
    process.exit(1);
  }

  const ext = path.extname(absFile).toLowerCase();
  if (ext !== ".pdf") {
    console.error(`Only PDF files are supported. Got: ${ext}`);
    process.exit(1);
  }

  return {
    file: absFile,
    lawId:
      get("law-id") ??
      `PDF-${path.basename(absFile, ".pdf").toUpperCase().replace(/\s+/g, "-")}`,
    lawTitle: get("law-title") ?? path.basename(absFile, ".pdf"),
    dryRun: args.includes("--dry-run"),
  };
}

// Main seeding function
async function seedFromPdf(): Promise<void> {
  const { file, lawId, lawTitle, dryRun } = parseArgs();

  console.log("");
  console.log("CLARA — Seed from PDF");
  console.log("─".repeat(50));
  console.log(`File:      ${file}`);
  console.log(`Law ID:    ${lawId}`);
  console.log(`Law Title: ${lawTitle}`);
  console.log(`Dry Run:   ${dryRun}`);
  console.log("");

  console.log("Reading PDF...");
  const pdfBuffer = fs.readFileSync(file);
  console.log(`File size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  // OCR extraction
  console.log("extracting text...");
  const rawText = await extractTextFromPdf(pdfBuffer);
  console.log(`Extracted: ${rawText.length} characters`);

  // Segment into clauses
  console.log("Segmenting into clauses ...");
  const clauses = segmentClauses(rawText);
  console.log(`  Found: ${clauses.length} clauses`);
  if (dryRun) {
    console.log("");
    console.log("CLAUSE PREVIEW:");
    clauses.slice(0, 5).forEach((c) => {
      console.log(`    [${c.index}] ${c.header} — ${c.content_preview.slice(0, 80)}...`);
    });
    if (clauses.length > 5) console.log(`    ... and ${clauses.length - 5} more clauses`);
    console.log("");
    console.log("Dry run complete. No data written to Neo4j");
    return;
  }

  // Connect to Neo4j
  console.log("Connecting to Neo4j ...");
  await verifyConnectivity();

  const session = getDriver().session();

  // Create/Upsert parent Law node
  console.log("Creating Law node ...");
  await session.run(
    `
    MERGE (l:Law { id: $lawId })
    SET l.title = $lawTitle,
        l.source_file = $sourceFile,
        l.seeded_at = datetime()
    `,
    { lawId, lawTitle, sourceFile: path.basename(file) },
  );
  console.log(`Law node: "${lawId} | OK"`);

  // Embed + store each clause
  console.log(`Embedding and storing ${clauses.length} clauses ...`);

  let stored = 0;
  let skipped = 0;

  for (const clause of clauses) {
    const articleId = `${lawId}-${String(clause.index).padStart(4, "0")}`;
    const contentForEmbedding = `${clause.header}. ${clause.content}`.slice(0, 8000);

    let embedding: number[] = [];
    try {
      embedding = await embedText(contentForEmbedding);
    } catch (embErr) {
      console.warn(
        `Embedding failed for clause ${clause.index} — storing without vector`,
      );
      skipped++;
    }

    await session.run(
      `
      MERGE (a:Article { id: $id })
      SET a.number         = $number,
          a.title          = $title,
          a.content        = $content,
          a.law_id         = $lawId,
          a.embedding      = $embedding,
          a.seeded_at      = datetime()
      WITH a
      MATCH (l:Law { id: $lawId })
      MERGE (a)-[:PART_OF]->(l)
      `,
      {
        id: articleId,
        number: clause.header,
        title: clause.header,
        content: clause.content,
        lawId,
        embedding,
      },
    );

    stored++;
    if (stored % 10 === 0 || stored === clauses.length) {
      process.stdout.write(`\r   Progress: ${stored}/${clauses.length} clauses stored`);
    }

    if (embedding.length > 0) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log("");
  await session.close();

  console.log("");
  console.log("Seeding complete!");
  console.log(`Law node:       ${lawId}`);
  console.log(`Clauses stored: ${stored}`);
  if (skipped > 0) {
    console.log(
      `Embeddings skipped: ${skipped}`,
    );
  }
}

// Entry point
seedFromPdf()
  .catch((err) => {
    console.error("");
    console.error("Seeding failed:", err?.message ?? err);
    process.exit(1);
  })
  .finally(closeDriver);
