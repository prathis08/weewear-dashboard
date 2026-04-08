import { Pool } from 'pg'

let pool

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV?.toLowerCase() === 'production'
        ? { rejectUnauthorized: false }
        : false,
    })
  }
  return pool
}

export async function query(text, params) {
  const client = getPool()
  return client.query(text, params)
}
