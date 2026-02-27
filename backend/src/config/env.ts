import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT ?? "3001", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",

  NEO4J_URI: requireEnv("NEO4J_URI"),
  NEO4J_USER: requireEnv("NEO4J_USER"),
  NEO4J_PASSWORD: requireEnv("NEO4J_PASSWORD"),

  GOOGLE_AI_API_KEY: requireEnv("GOOGLE_AI_API_KEY"),
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL ?? "gemini-embedding-001",
  EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION ?? "768", 10),
} as const;
