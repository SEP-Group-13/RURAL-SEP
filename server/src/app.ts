import express from 'express'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import env from '@/utils/env.js'
import { waitForDatabaseConnection } from '@/utils/database.js'
import { errorHandler } from '@/routes/error.route.js'
import metaRouter from '@/routes/meta.router.js'


const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()


// Midlewares
app.use(express.static(path.resolve(__dirname, '../../dist/client/client')))  // Built React SPA (npm run build:client)
app.use(express.static(path.resolve(__dirname, "../../public")))    // Will eventually be replaced by nginx or equivalent
app.use(express.json()) // Allows parsing of application/json


// Routes
app.use('/api/meta', metaRouter)
app.use(errorHandler)


// Start listening
try {
  // Refuse requests until the configured database accepts an authenticated query.
  await waitForDatabaseConnection()
  console.log('Database connection verified')
  http.createServer(app).listen(Number(env.PORT), env.HOST, () => {
    console.log(`Server started ${new Date()} on port ${env.PORT}`)
    console.log(`http://${env.HOST}:${env.PORT}/`)
  })
} catch (err) {
  console.error("Failed to start the server or connect to the database")
  console.error(err)
  process.exit(1)
}
