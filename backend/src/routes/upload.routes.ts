import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/require-auth.js";
import { isStorageConfigured, uploadFile } from "../lib/storage.js";

export const uploadRouter = Router();

uploadRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ALLOWED_TYPES = ["resume", "transcript", "project-image"] as const;

// Which file formats each kind of upload accepts.
const ALLOWED_MIME: Record<(typeof ALLOWED_TYPES)[number], string[]> = {
  resume: ["application/pdf"],
  transcript: ["application/pdf"],
  "project-image": ["image/png", "image/jpeg", "image/webp", "image/gif"],
};
type UploadType = (typeof ALLOWED_TYPES)[number];

function isUploadType(value: unknown): value is UploadType {
  return typeof value === "string" && (ALLOWED_TYPES as readonly string[]).includes(value);
}

uploadRouter.get("/status", (_req, res) => {
  res.json({ configured: isStorageConfigured() });
});

uploadRouter.post("/", upload.single("file"), async (req, res) => {
  if (!isStorageConfigured()) {
    res.status(503).json({ error: "File storage is not configured on this server. Paste a URL instead." });
    return;
  }

  const type = req.body?.["type"];
  if (!isUploadType(type)) {
    res.status(400).json({ error: `type must be one of: ${ALLOWED_TYPES.join(", ")}` });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "file is required" });
    return;
  }

  if (!ALLOWED_MIME[type].includes(req.file.mimetype)) {
    res.status(400).json({ error: `This file type isn't allowed. Use: ${ALLOWED_MIME[type].join(", ")}` });
    return;
  }

  const url = await uploadFile(req.file.buffer, req.file.mimetype, `${type}/${req.auth!.userId}`);
  res.json({ url });
});
