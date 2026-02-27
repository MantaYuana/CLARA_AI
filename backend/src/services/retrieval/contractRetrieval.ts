/**
 * contractRetrieval.ts
 * Dense vector search over ContractClause nodes, filtered by document_id.
 * Used to retrieve clauses from a previously uploaded contract during chat.
 */
import { getSession } from "../../config/neo4j";
import { embedText } from "../embedding/embeddingService";
import { TaskType } from "@google/generative-ai";
import type { RetrievalResult } from "./denseRetrieval";

export async function contractRetrieval(
  queryText: string,
  documentId: string,
  topK = 5,
): Promise<RetrievalResult[]> {
  const queryEmbedding = await embedText(queryText, TaskType.RETRIEVAL_QUERY);
  const session = await getSession();

  try {
    // Use vector index with a WHERE filter on document_id
    const result = await session.run(
      `
      CALL db.index.vector.queryNodes('contract_clause_embedding_idx', $topK, $embedding)
      YIELD node AS cc, score
      WHERE cc.document_id = $documentId
      RETURN
        cc.id         AS id,
        'ContractClause' AS label,
        cc.header     AS title,
        cc.content    AS content,
        score,
        'Uploaded Contract' AS source
      ORDER BY score DESC
      `,
      { topK: topK * 2, embedding: queryEmbedding, documentId },
      // fetch 2x then filter; vector index doesn't support pre-filter in all versions
    );

    return result.records.slice(0, topK).map((rec) => ({
      id: rec.get("id") as string,
      label: "ContractClause" as const,
      title: rec.get("title") as string,
      content: rec.get("content") as string,
      score: rec.get("score") as number,
      source: "Uploaded Contract",
    }));
  } finally {
    await session.close();
  }
}
