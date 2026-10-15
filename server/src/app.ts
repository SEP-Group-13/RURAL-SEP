import express from 'express'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import env from '@/utils/env.js'
import { waitForDatabaseConnection } from '@/utils/database.js'
import { errorHandler } from '@/routes/error.route.js'


const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

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
app.use(express.static(path.resolve(__dirname, "../../public")))    // Will eventually be replaced by nginx or equivalent
// app.use(cookieParser()) // Allows parsing of cookies
app.use(express.json()) // Allows parsing of application/json

// const limiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests were received, try again later',
// })
// app.use('/api/', limiter)


// Routes
// app.use('/api/user', userRoutes)
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
