import dotenv from "dotenv"
import { z } from "zod"
console.log(`Loading *${process.env.NODE_ENV}* envs`);
// Scripts run from server/ (npm workspace), the env files live in the repo root
dotenv.config({path: `../.env.${process.env.NODE_ENV}`})
dotenv.config({path: `../.env`})

// Define all environment variables in one place
const env: Record<string, string> = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000).transform(String),
  HOST: z.string().min(1).default("127.0.0.1"),
  PGHOST: z.string().min(1).default("127.0.0.1"),
  PGPORT: z.coerce.number().int().min(1).max(65535).default(5432).transform(String),
  PGDATABASE: z.string().min(1),
  PGUSER: z.string().min(1),
  PGPASSWORD: z.string().min(1),
}).parse(process.env)

export default env;
