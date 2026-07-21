import serverlessHttp from 'serverless-http';
import app from './app.js';
import connectDB from './config/db.js';

// serverless-http translates between the API Gateway event/context shape
// and the (req, res) shape Express expects. Built once at module scope
// (cold start) and reused across warm invocations — cheap to construct,
// but no reason to redo it every call.
const serverlessHandler = serverlessHttp(app);

export const handler = async (event, context) => {
  // The cached MongoDB connection intentionally keeps its socket(s) open
  // between invocations for reuse. Without this flag, Lambda would wait
  // for the event loop to fully drain (i.e. for those sockets to close)
  // before returning a response, and every request would hang until timeout.
  context.callbackWaitsForEmptyEventLoop = false;

  // No-op on warm starts (readyState already 1); reconnects on cold
  // starts or if the connection was dropped. Note: unlike server.js,
  // failures here are NOT caught with process.exit — they propagate and
  // Lambda reports the invocation as an error (visible in CloudWatch and
  // returned to API Gateway as a 502), which is the correct serverless
  // behavior instead of killing the whole execution environment.
  await connectDB();

  return serverlessHandler(event, context);
};
