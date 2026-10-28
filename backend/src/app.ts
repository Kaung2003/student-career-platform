import { randomUUID } from "crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { authRouter } from "./routes/auth.routes.js";
import { accountRouter } from "./routes/account.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { projectRouter } from "./routes/project.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";
import { certificationRouter } from "./routes/certification.routes.js";
import { interviewRouter } from "./routes/interview.routes.js";
import { feedbackRouter } from "./routes/feedback.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { isAiConfigured } from "./lib/ai.js";
import { isStorageConfigured } from "./lib/storage.js";
import { isEmailConfigured } from "./lib/email.js";
import { HttpError } from "./lib/http.js";
import { apiLimiter } from "./lib/rate-limit.js";
import { prisma } from "./lib/prisma.js";

export function createApp() {
  const app = express();

  const allowedOrigins = process.env["CORS_ORIGIN"]
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins, credentials: true } : {}));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Every request gets an id, echoed in the response and in error logs, so problems can be traced.
  app.use((req, res, next) => {
    const id = (typeof req.headers["x-request-id"] === "string" && req.headers["x-request-id"]) || randomUUID();
    res.locals["requestId"] = id;
    res.setHeader("X-Request-Id", id);
    next();
  });

  app.get("/health", async (_req, res) => {
    let database = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = false;
    }
    res.status(database ? 200 : 503).json({
      status: database ? "ok" : "degraded",
      database,
      ai: isAiConfigured(),
      storage: isStorageConfigured(),
      email: isEmailConfigured(),
    });
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth", authRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/projects", projectRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/uploads", uploadRouter);
  app.use("/api/certifications", certificationRouter);
  app.use("/api/interview", interviewRouter);
  app.use("/api/feedback", feedbackRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/admin", adminRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }

    const e = err as { type?: string; code?: string; status?: number };
    if (e?.type === "entity.parse.failed") {
      res.status(400).json({ error: "Request body must be valid JSON" });
      return;
    }
    if (e?.type === "entity.too.large" || e?.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "That request is too large" });
      return;
    }
    if (e?.code === "P2025") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    console.error(
      JSON.stringify({
        level: "error",
        requestId: res.locals["requestId"],
        method: req.method,
        path: req.path,
        userId: req.auth?.userId,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }),
    );
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong on our side. Please try again.", requestId: res.locals["requestId"] });
    }
  });

  return app;
}
