import "dotenv/config";
import { createApp } from "./app.js";
import { initMonitoring } from "./lib/monitoring.js";
import { startEmailWorker } from "./lib/email-queue.js";
import { startCleanup } from "./lib/cleanup.js";

initMonitoring();

const PORT = process.env["PORT"] ?? 4000;

createApp().listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  startEmailWorker();
  startCleanup();
});
