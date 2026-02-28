/**
 * chatService.ts
 *
 * Centralized service to persist chat history across Drafter, Query,
 * and Contract Review endpoints.
 */
import { getSession } from "../../config/neo4j";
import { v4 as uuidv4 } from "uuid";

export type EndpointType = "drafter" | "query" | "contract";
export type ChatRole = "user" | "assistant" | "model";

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface StoredChatMessage extends ChatMessage {
    id: string;
    timestamp: string;
}

/**
 * Saves a new message to a ChatSession.
 * If the session doesn't exist, it creates it.
 */
export async function saveChatMessage(
    sessionId: string,
    userId: string,
    endpointType: EndpointType,
    role: ChatRole,
    content: string,
    documentId?: string | null,
): Promise<void> {
    const dbSession = await getSession();
    try {
        await dbSession.run(
            `
      // Ensure the ChatSession exists
      MERGE (cs:ChatSession { id: $sessionId })
      ON CREATE SET cs.user_id = $userId,
                    cs.endpoint_type = $endpointType,
                    cs.created_at = datetime()
      SET cs.document_id = COALESCE($documentId, cs.document_id),
          cs.updated_at = datetime()

      // Create the new message
      CREATE (cm:ChatMessage {
        id: $messageId,
        session_id: $sessionId,
        role: $role,
        content: $content,
        timestamp: datetime()
      })

      // Link them
      MERGE (cs)-[:HAS_MESSAGE]->(cm)
      `,
            {
                sessionId,
                userId,
                endpointType,
                documentId: documentId ?? null,
                messageId: uuidv4(),
                role,
                content,
            },
        );
    } catch (err) {
        console.warn("[chatService] Failed to save chat message:", err);
    } finally {
        await dbSession.close();
    }
}

/**
 * Retrieves the full chat history for a given session, ordered by timestamp.
 */
export async function getSessionHistory(
    sessionId: string,
): Promise<StoredChatMessage[]> {
    const dbSession = await getSession();
    try {
        const result = await dbSession.run(
            `
      MATCH (cs:ChatSession { id: $sessionId })-[:HAS_MESSAGE]->(cm:ChatMessage)
      RETURN cm.id AS id, cm.role AS role, cm.content AS content, toString(cm.timestamp) AS timestamp
      ORDER BY cm.timestamp ASC
      `,
            { sessionId },
        );

        return result.records.map((record) => ({
            id: record.get("id"),
            role: record.get("role") as ChatRole,
            content: record.get("content"),
            timestamp: record.get("timestamp"),
        }));
    } catch (err) {
        console.warn("[chatService] Failed to fetch chat history:", err);
        return [];
    } finally {
        await dbSession.close();
    }
}
