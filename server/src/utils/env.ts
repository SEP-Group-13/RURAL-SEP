import dotenv from "dotenv"
console.log(`Loading *${process.env.NODE_ENV}* envs`);
dotenv.config({path: `.env.${process.env.NODE_ENV}`})
dotenv.config({path: `.env`})

const required = (name: string): string => {
  if (!process.env[name]) {
    throw new Error(`Missing env variable: ${name}`)
  }
  
  return process.env[name];
}

// Defaults
const port = process.env.PORT || "3000";
const host = process.env.HOST || "127.0.0.1";

// Define all environment variables in one place
const env: Record<string, string> = {
  PORT: port,
  HOST: host,
  // APP_URL: `http://${host}:${port}`,
  // DB_URL: required("DB_URL"),
}

export default env;