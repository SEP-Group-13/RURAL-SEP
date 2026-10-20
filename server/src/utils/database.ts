import { Client } from 'pg'
import { setTimeout } from 'node:timers/promises'
import env from '@/utils/env.js'

// URF 5.1: verify database access without depending on an application schema.
export async function checkDatabaseConnection(): Promise<void> {
  const client = new Client({
    host: env.PGHOST,
    port: Number(env.PGPORT),
    database: env.PGDATABASE,
    user: env.PGUSER,
    password: env.PGPASSWORD,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  })

  // pg also emits connection failures as events, including during a query.
  let connectionError: Error | undefined
  client.on('error', (err: Error) => {
    connectionError = err
  })

  try {
    await client.connect()
    await client.query('SELECT 1')
  } finally {
    await client.end()
  }

  if (connectionError) {
    throw connectionError
  }
}

// Keep startup recoverable under tsx watch, which survives application exits.
export async function waitForDatabaseConnection(): Promise<void> {
  while (true) {
    try {
      await checkDatabaseConnection()
      return
    } catch (err) {
      console.error('Database unavailable; retrying in 2 seconds', err)
      await setTimeout(2000)
    }
  }
}
