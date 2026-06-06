import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/morvex-db';

// Export exact error details and diagnostics for the front-end to read
export let lastConnectionError: any = null;

export interface DBErrorDetails {
  message: string;
  code?: string;
  name?: string;
  diagnosticExplanation: string;
  checks: {
    uriValidity: 'valid' | 'invalid' | 'unknown';
    atlasNetworkAccess: string;
    userCredentials: string;
    mongooseStatus: string;
    dnsResolution: string;
    atlasConnectivity: string;
  };
}

export function getDBCleanErrorMessage(error: any): DBErrorDetails {
  const message = error instanceof Error ? error.message : String(error);
  const name = error?.name || 'MongooseConnectionError';
  const code = error?.code;

  let diagnosticExplanation = "An unexpected error occurred while establishing a connection with MongoDB.";
  let uriValidity: 'valid' | 'invalid' | 'unknown' = 'unknown';
  let dnsResolution = "Pending / Untested";
  let atlasNetworkAccess = "Possible block. Ensure that dynamic container ingress/egress is allowed.";
  let userCredentials = "Check username and password in MONGODB_URI.";
  let mongooseStatus = `Mongoose Connection State: ${mongoose.connection.readyState} (Disconnected)`;
  let atlasConnectivity = "Connection timed out during server selection handshake.";

  // If there's an IP whitelisting error or Server Selection Timeout (extremely common in sandboxes)
  if (name === 'MongooseServerSelectionError' || message.includes('ServerSelectionError') || message.includes('Could not connect to any servers')) {
    diagnosticExplanation = "MongoDB Atlas Server Selection Timeout. This is almost always caused by MongoDB Atlas IP Whitelisting (Network Access) restrictions. Because this application is hosted in a sandboxed Cloud Run environment, its outbound IP address is highly dynamic. You must allow connections from any IP address (whitelist '0.0.0.0/0') in your MongoDB Atlas console.";
    atlasNetworkAccess = "❌ RESTRICTED. Current container IP address is blocked by your MongoDB Atlas IP Whitelist. Set Atlas Whitelist to '0.0.0.0/0' (Allow access from anywhere) to resolve.";
    dnsResolution = "✅ RESOLVED. DNS lookup for the Atlas cluster hostname succeeded, but the subsequent socket connection was blocked.";
    atlasConnectivity = "❌ TIMED OUT. Socket handshake failed because access was refused or dropped at the packet level.";
    uriValidity = 'valid';
  } else if (message.includes('bad auth') || message.includes('Authentication failed') || message.includes('auth failed') || message.includes('MongoServerError: bad auth')) {
    diagnosticExplanation = "Database user authentication failed. The credentials (username and/or password) specified in your MONGODB_URI environment variable are incorrect, have expired, or have incorrect permission roles configured in the Atlas Access Manager.";
    userCredentials = "❌ FAILED AUTHENTICATION. The database user credentials in your MONGODB_URI are rejected by Atlas.";
    uriValidity = 'valid';
    atlasNetworkAccess = "✅ CONNECTED. Socket level connection allowed, but credentials handshake failed.";
    dnsResolution = "✅ RESOLVED. Successfully reached the database cluster authority.";
    atlasConnectivity = "✅ ONLINE. Atlas clusters are reachable.";
  } else if (message.includes('ENOTFOUND') || message.includes('EAI_AGAIN') || message.includes('dns') || message.includes('getaddrinfo')) {
    diagnosticExplanation = "DNS Resolution failed. The system is unable to resolve the hostname in your connection string. This can happen if the domain structure is typed incorrectly in MONGODB_URI, or if there is a primary DNS server block or service failure.";
    dnsResolution = "❌ FAILED. Hostname resolution failed. Unable to convert clustering server URLs into active IP addresses.";
    atlasConnectivity = "❌ UNREACHABLE. Cannot resolve Atlas domain.";
    uriValidity = 'invalid';
  } else if (!MONGODB_URI || MONGODB_URI.startsWith('mongodb://localhost')) {
    diagnosticExplanation = "Your database connection string is falling back to localhost. You must configure the MONGODB_URI environment variable to point to a valid remote MongoDB Atlas or Cloud MongoDB deployment.";
    uriValidity = 'invalid';
    userCredentials = "⚠️ LOCAL DEMO. Local credentials cannot connect to external Atlas services.";
    dnsResolution = "⚠️ LOCALHOST. Connecting locally.";
    atlasNetworkAccess = "⚠️ LOCALHOST. Outside Atlas Network.";
    atlasConnectivity = "❌ LOCAL ONLY.";
  }

  return {
    message,
    name,
    code: code ? String(code) : undefined,
    diagnosticExplanation,
    checks: {
      uriValidity,
      atlasNetworkAccess,
      userCredentials,
      mongooseStatus,
      dnsResolution,
      atlasConnectivity
    }
  };
}

export async function connectDB(): Promise<void> {
  const maxRetries = 3;
  const retryInterval = 1000; // 1 second

  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false); // Disable commands buffering

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔌 [Database] Connection attempt ${attempt}/${maxRetries}...`);
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 3000, // 3s timeout for fast response
      });
      console.log('✨ [Database] MongoDB Connected successfully.');
      lastConnectionError = null; // Clear error on successful connection
      return; // Succeeded, exit connection function
    } catch (error) {
      lastConnectionError = error;
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        console.error('❌ [Database] Connection failed after maximum retry attempts:', error);
      } else {
        console.warn(`⚠️ [Database] Connection attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}. Retrying in ${retryInterval}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }
  }
}
