import multer from "multer";
import { randomBytes } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = join(__dirname, "../../uploads");

if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const randomName = randomBytes(16).toString("hex");
    const ext = file.originalname.split(".").pop();
    cb(null, `${randomName}.${ext}`);
  },
});

export const upload = multer({ storage });
