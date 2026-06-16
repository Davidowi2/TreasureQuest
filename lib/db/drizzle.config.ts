import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "../..");
config({ path: join(projectRoot, ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: [
    "./src/schema/users.ts",
    "./src/schema/hunts.ts",
    "./src/schema/clues.ts",
    "./src/schema/teams.ts",
    "./src/schema/teamMembers.ts",
    "./src/schema/teamProgress.ts",
    "./src/schema/clueAttempts.ts",
    "./src/schema/verificationJobs.ts",
    "./src/schema/huntPlayers.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
