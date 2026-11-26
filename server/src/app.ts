import express from 'express'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import env from '@/utils/env.js'
import { waitForDatabaseConnection } from '@/utils/database.js'
import { errorHandler } from '@/routes/error.route.js'
import { notFound } from '@/utils/httpResponses.js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const clientDir = path.resolve(__dirname, '../../dist/client/client')


// Midlewares
app.use(express.static(clientDir))  // Built React SPA (npm run build:client)
app.use(express.static(path.resolve(__dirname, "../../public")))    // Will eventually be replaced by nginx or equivalent
app.use(express.json()) // Allows parsing of application/json


// Routes
// app.use('/api/user', userRoutes)

// Unknown API routes return JSON 404
app.use('/api', (_req, res) => { notFound(res) })

// SPA fallback. other paths gets index.html so client-side routes survive a refresh.
// fall back to Express's default 404 if the client hasn't been built
app.get('/{*splat}', (req, res, next) => {
  res.sendFile(path.join(clientDir, 'index.html'), (err) => {
    if (err) next()
  })
})

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
