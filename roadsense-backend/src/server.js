import app from "./app.js";
import env from "./config/env.js";
import { connectDatabase } from "./config/db.js";

async function startServer() {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`RoadSense backend running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
