import { Pool } from 'pg'

// Create a PostgreSQL connection pool for raw SQL queries
// This is used for lookup management and other advanced queries
let pool: Pool | null = null

export const db = {
  query: async (text: string, params?: any[]) => {
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' 
          ? { rejectUnauthorized: false } 
          : false
      })
    }
    return pool.query(text, params)
  },
  
  getPool: () => {
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' 
          ? { rejectUnauthorized: false } 
          : false
      })
    }
    return pool
  },
  
  end: async () => {
    if (pool) {
      await pool.end()
      pool = null
    }
  }
}
