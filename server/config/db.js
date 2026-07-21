import mongoose from 'mongoose';

// Module-level (not function-level) so it survives across warm Lambda
// invocations — Lambda freezes/thaws the same Node process between calls,
// so anything declared here persists as long as the execution environment
// does, effectively acting as a connection pool cache.
let cachedConnection = null;

const connectDB = async () => {
  // readyState 1 = connected. Re-use the live connection on warm starts
  // instead of paying the ~100-500ms handshake cost on every invocation.
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // bufferCommands: false makes queries fail fast instead of silently
  // queueing if the connection drops — important in Lambda where a hung
  // query would otherwise burn through the whole function timeout.
  // maxPoolSize is capped low because every concurrent Lambda execution
  // environment opens its own pool; a high value here can exhaust
  // MongoDB Atlas's free-tier (M0) connection limit under load.
  cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 5,
  });

  console.log(`MongoDB Connected: ${cachedConnection.connection.host}`);
  return cachedConnection;
};

export default connectDB;
