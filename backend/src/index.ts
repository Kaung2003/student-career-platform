import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { authRouter } from "./routes/auth.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { projectRouter } from "./routes/project.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";
import { certificationRouter } from "./routes/certification.routes.js";
import { interviewRouter } from "./routes/interview.routes.js";
import { feedbackRouter } from "./routes/feedback.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/projects", projectRouter);
app.use("/api/public", publicRouter);
app.use("/api/chat", chatRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/certifications", certificationRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/feedback", feedbackRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env["PORT"] ?? 4000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
