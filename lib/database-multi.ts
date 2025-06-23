import { Pool, type PoolClient } from "pg"

// Determine connection method based on environment
const isProduction = process.env.NODE_ENV === "production"
const isGoogleCloud = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID

// Base connection configuration (without database name)
const getBaseConfig = () => {
  if (isProduction && isGoogleCloud) {
    // Unix Socket for production
    return {
      host: `/cloudsql/${process.env.FIREBASE_PROJECT_ID}:us-east4:gg-instance`,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  } else {
    // Public IP for local development
    return {
      host: process.env.DB_HOST || "34.86.121.148",
      port: Number.parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  }
}

// Create multiple connection pools for different databases
const pools = {
  corp: new Pool({ ...getBaseConfig(), database: "corp" }),
  gg: new Pool({ ...getBaseConfig(), database: "gg" }),
  // Add more databases as needed
  // analytics: new Pool({ ...getBaseConfig(), database: "analytics" }),
}

// Database-specific query functions
export const corpDB = {
  query: async (text: string, params?: any[]) => {
    console.log("🏢 Executing query on 'corp' database")
    return await pools.corp.query(text, params)
  },
  getClient: async (): Promise<PoolClient> => {
    return await pools.corp.connect()
  },
  testConnection: async () => {
    try {
      const result = await pools.corp.query("SELECT current_database(), current_user, NOW()")
      console.log("✅ 'corp' database connected:", result.rows[0])
      return { success: true, data: result.rows[0] }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ 'corp' database connection failed:", errorMessage)
      return { success: false, error: errorMessage }
    }
  },
}

export const ggDB = {
  query: async (text: string, params?: any[]) => {
    console.log("🎮 Executing query on 'gg' database")
    return await pools.gg.query(text, params)
  },
  getClient: async (): Promise<PoolClient> => {
    return await pools.gg.connect()
  },
  testConnection: async () => {
    try {
      const result = await pools.gg.query("SELECT current_database(), current_user, NOW()")
      console.log("✅ 'gg' database connected:", result.rows[0])
      return { success: true, data: result.rows[0] }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ 'gg' database connection failed:", errorMessage)
      return { success: false, error: errorMessage }
    }
  },
}

// Generic database connector
export const connectToDatabase = (databaseName: string) => {
  const pool = new Pool({ ...getBaseConfig(), database: databaseName })

  return {
    query: async (text: string, params?: any[]) => {
      console.log(`🔍 Executing query on '${databaseName}' database`)
      return await pool.query(text, params)
    },
    getClient: async (): Promise<PoolClient> => {
      return await pool.connect()
    },
    testConnection: async () => {
      try {
        const result = await pool.query("SELECT current_database(), current_user, NOW()")
        console.log(`✅ '${databaseName}' database connected:`, result.rows[0])
        return { success: true, data: result.rows[0] }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error(`❌ '${databaseName}' database connection failed:`, errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    close: async () => {
      await pool.end()
      console.log(`🔒 '${databaseName}' database pool closed`)
    },
  }
}

// Close all pools
export const closeAllPools = async () => {
  await Promise.all([pools.corp.end(), pools.gg.end()])
  console.log("🔒 All database pools closed")
}

// Export the original functions for backward compatibility
export const query = corpDB.query
export const getClient = corpDB.getClient
export const testConnection = corpDB.testConnection
