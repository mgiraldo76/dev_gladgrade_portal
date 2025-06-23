import { Pool, type PoolClient } from "pg"

// Determine connection method based on environment
const isProduction = process.env.NODE_ENV === "production"
const isGoogleCloud = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID

// Database connection configuration
const dbConfig = (() => {
  // Method 1: Unix Socket (for Google Cloud Run/App Engine)
  if (isProduction && isGoogleCloud) {
    console.log("🔗 Using Unix Socket connection for Google Cloud")
    return {
      host: `/cloudsql/${process.env.FIREBASE_PROJECT_ID}:us-east4:gg-instance`,
      database: process.env.DB_NAME || "corp",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      ssl: false, // Not needed for Unix socket
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  }

  // Method 2: Public IP (for local development)
  console.log("🔗 Using Public IP connection for local development")
  return {
    host: process.env.DB_HOST || "34.86.121.148",
    port: Number.parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "corp",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false, // Required for Google Cloud SQL public IP
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }
})()

// Create connection pool
const pool = new Pool(dbConfig)

// Handle pool errors
pool.on("error", (err: Error) => {
  console.error("❌ Unexpected error on idle client", err)
  process.exit(-1)
})

// Log connection details (without password)
console.log("🔧 Database Configuration:", {
  host: dbConfig.host,
  port: dbConfig.port || "Unix Socket",
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: !!dbConfig.ssl,
  environment: process.env.NODE_ENV,
  isGoogleCloud: !!isGoogleCloud,
})

// Test database connection
export async function testConnection() {
  try {
    console.log("🧪 Testing database connection...")
    const client = await pool.connect()

    const result = await client.query(`
      SELECT 
        NOW() as current_time, 
        version() as postgres_version,
        current_database() as database_name,
        current_user as current_user,
        inet_server_addr() as server_ip
    `)

    client.release()

    const connectionInfo = result.rows[0]
    console.log("✅ Database connected successfully!")
    console.log("🕐 Current time:", connectionInfo.current_time)
    console.log("🗄️ Database:", connectionInfo.database_name)
    console.log("👤 User:", connectionInfo.current_user)
    console.log("🌐 Server IP:", connectionInfo.server_ip || "Unix Socket")
    console.log("📊 PostgreSQL version:", connectionInfo.postgres_version)

    return { success: true, data: connectionInfo }
  } catch (error: unknown) {
    console.error("❌ Database connection failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    // Provide helpful error messages
    if (errorMessage.includes("ECONNREFUSED")) {
      console.error("💡 Tip: Make sure your Google Cloud SQL instance is running and accessible")
    }
    if (errorMessage.includes("password authentication failed")) {
      console.error("💡 Tip: Check your database username and password")
    }
    if (errorMessage.includes("database") && errorMessage.includes("does not exist")) {
      console.error("💡 Tip: Make sure the 'corp' database exists in your instance")
    }

    return { success: false, error: errorMessage }
  }
}

// Execute a query with error handling
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now()

  try {
    console.log("🔍 Executing query:", text.substring(0, 100) + (text.length > 100 ? "..." : ""))

    const result = await pool.query(text, params)
    const duration = Date.now() - start

    console.log(`✅ Query executed in ${duration}ms, returned ${result.rowCount} rows`)

    return result
  } catch (error: unknown) {
    const duration = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    console.error(`❌ Query failed after ${duration}ms:`, errorMessage)
    console.error("📝 Query:", text.substring(0, 200))
    console.error("📋 Params:", params)
    throw error
  }
}

// Get a client from the pool for transactions
export async function getClient(): Promise<PoolClient> {
  return await pool.connect()
}

// Close the pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  await pool.end()
  console.log("🔒 Database pool closed")
}

export default pool
