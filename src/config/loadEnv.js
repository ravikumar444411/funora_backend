const dotenv = require("dotenv");
const path = require("path");

// Default to development if NODE_ENV not set
const env = process.env.NODE_ENV || "development";

// Load the corresponding .env file
const envFile = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envFile });

console.log(`⚡ Loaded environment: ${env} from ${envFile}`);
