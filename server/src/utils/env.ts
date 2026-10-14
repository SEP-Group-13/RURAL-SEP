import dotenv from "dotenv"
console.log(`Loading *${process.env.NODE_ENV}* envs`);
dotenv.config({path: `.env.${process.env.NODE_ENV}`})
dotenv.config({path: `.env`})

// small change I added in order to make this work at localhost:3000 - Vlad
process.env.PORT = "3000"
process.env.IP = "localhost"
process.env.URL = "http://localhost:3000/"

// Add necessary .env variables to the array below
const envs = ["PORT", "IP", "URL"];
let env: Record<string, string> = {};

for (const vars of envs) {
  if (!process.env[vars]) {
    throw new Error(`Missing env variable: ${vars}`)
  }
  env[vars] = process.env[vars];
}

// Manual Changes
// env["DB_URL"] = process.env.DB_URL!.replace("${DB_USER}", env["DB_USER"]).replace("${DB_PASS}", env["DB_PASS"]).replace("${DB_NAME}", env["DB_NAME"]);
env["URL"] = process.env.URL!.replace("${PORT}", env["PORT"]).replace("${IP}", env["IP"]);

export default env;