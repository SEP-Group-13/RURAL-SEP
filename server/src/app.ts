import express from 'express'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import env from '@/utils/env.js'
import { waitForDatabaseConnection } from '@/utils/database.js'
import { errorHandler } from '@/routes/error.route.js'
import healthRoutes from '@/routes/health.route.js'
import participantsRoutes from '@/routes/participants.route.js'
import metaRoutes from '@/routes/meta.route.js'
import { newApiError } from '@shared/api/error.validator.js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const clientDir = path.resolve(__dirname, '../../dist/client/client')

// // Debugging: Logs all incoming requests
// app.use((req, res, next) => {
//   console.log(`Incoming request: ${req.method} ${req.url}`)
//   next()
// })

// Cors not needed as long as frontend and backend are on the same origin
// app.use(cors({
//   origin: env.URL,
//   credentials: true // allows cookies
// }))


// Midlewares
app.use(express.static(clientDir))  // Built React SPA (npm run build:client)
app.use(express.static(path.resolve(__dirname, "../../public")))    // Will eventually be replaced by nginx or equivalent
// app.use(cookieParser()) // Allows parsing of cookies
app.use(express.json()) // Allows parsing of application/json

// Stops browsers, proxies, from caching API responses
app.use('/api', (req, rest, next) => {
  rest.set('Cache-control', 'no-store')
  next()
})

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many requests were received, try again later',
})
app.use('/api', limiter)


// Routes
app.use('/api/health', healthRoutes)
app.use('/api/v1/participants', participantsRoutes)
app.use('/api/v1/meta', metaRoutes)
// app.use('/api/user', userRoutes)

// Unknown API routes return JSON
app.use('/api', (req, res) => {
  res.status(404).json(newApiError('Not found'))
})

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
