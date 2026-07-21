import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

// This file is the LOCAL DEVELOPMENT / traditional-Node entrypoint only.
// It is never used on Lambda — lambda.js is the entrypoint there. It's
// responsible for the two things that differ between environments:
// loading .env into process.env, and starting an HTTP listener.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the repo-root .env (unchanged path/behavior)
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start listening. A failed connection here
// exits the process — appropriate for a long-running server, but this
// exact behavior is intentionally NOT replicated in lambda.js.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
