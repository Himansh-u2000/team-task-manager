import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This module defines the Express app ONLY — no dotenv loading, no
// connectDB() call, no app.listen(). Both the local dev server
// (server.js) and the Lambda handler (lambda.js) import this same app
// and are responsible for their own bootstrapping, since "start a DB
// connection" and "start listening on a port" mean different things in
// each environment.
const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.set('trust proxy', 1);

// Middleware (unchanged from the original server.js)
app.use(
  helmet({
    crossOriginResourcePolicy:
      process.env.NODE_ENV === 'production'
        ? { policy: 'cross-origin' }
        : false,
  })
);
app.use(cors({
  origin: clientUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes (unchanged)
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check (unchanged)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the built React app ONLY when running as a traditional Node
// process (e.g. `npm start` on a VM/container). AWS_LAMBDA_FUNCTION_NAME
// is a reserved variable the Lambda runtime always sets automatically —
// checking it lets us detect "am I running on Lambda?" without adding a
// custom env var. In the serverless architecture the React build is
// served by S3 + CloudFront instead, and client/dist won't even exist
// inside the Lambda deployment package (only server/ is uploaded), so
// this block must not run there.
if (process.env.NODE_ENV === 'production' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const clientPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error handler (unchanged)
app.use(errorHandler);

export default app;
