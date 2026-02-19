import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "spamzero";

if (!uri) {
  throw new Error("Missing MONGODB_URI in environment variables");
}

const globalForMongo = globalThis;

if (!globalForMongo._mongoClientPromise) {
  globalForMongo._mongoClientPromise = new MongoClient(uri).connect();
}

export async function getDb() {
  const connectedClient = await globalForMongo._mongoClientPromise;
  return connectedClient.db(dbName);
}
