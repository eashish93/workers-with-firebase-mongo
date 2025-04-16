import { DurableObject } from 'cloudflare:workers';
import { MongoClient, Db, FindOptions, Filter, ObjectId } from 'mongodb';

// Define an interface for the environment variables passed to the DO
export interface Env {
  MONGODB_URI: string;
  MONGODB_DB: string;
}

// Define the Durable Object class
export class MongoDurableObject extends DurableObject {
  // Make these properties accessible within the class
  client: MongoClient;
  dbInstance: Db | null = null;
  connectPromise: Promise<void> | null = null;
  env: Env;
  ctx: any; // Store context/state passed to constructor

  // Use 'any' or a more specific type if known for the first arg based on CF types
  constructor(ctx: any, env: Env) {
    super(ctx, env); // Pass context/state to super
    this.ctx = ctx; // Store context/state if needed (e.g., for ctx.waitUntil)
    this.env = env;

    // Initialize the MongoClient in the constructor.
    // It will persist for the lifetime of the DO instance.
    const options = {
      maxPoolSize: 10, // Keep pool size modest for DO
      maxConnecting: 2,
      serverSelectionTimeoutMS: 5000,
      maxIdleTimeMS: 20 * 1000, // Close idle connections
    };
    this.client = new MongoClient(env.MONGODB_URI, options);
    // Access ID via the context/state object (assuming it has an 'id' property)
    console.log(`[MongoDO ${this.ctx.id}] Constructor: MongoClient initialized.`);
  }

  // Ensures the client is connected and dbInstance is set
  private async ensureConnected(): Promise<void> {
    // If already connected, we're good.
    if (this.dbInstance) {
      return;
    }

    // If a connection attempt is already in progress, wait for it.
    if (this.connectPromise) {
      console.log(`[MongoDO ${this.ctx.id}] ensureConnected: Awaiting existing connection promise.`);
      await this.connectPromise;
      // Re-check if dbInstance was set by the awaited promise
      if (this.dbInstance) return;
      // If not, the promise might have failed, fall through to retry
    }

    // Start a new connection attempt
    console.log(`[MongoDO ${this.ctx.id}] ensureConnected: Starting new connection...`);
    this.connectPromise = (async () => {
      try {
        await this.client.connect();
        this.dbInstance = this.client.db(this.env.MONGODB_DB);
        console.log(`[MongoDO ${this.ctx.id}] ensureConnected: Connection successful.`);
      } catch (err) {
        console.error(`[MongoDO ${this.ctx.id}] ensureConnected: Connection error:`, err);
        this.dbInstance = null; // Ensure db is null on error
        this.connectPromise = null; // Reset promise so next call retries
        throw err; // Re-throw the error
      }
    })();

    try {
        await this.connectPromise;
    } finally {
        // Ensure connectPromise is cleared once the attempt finishes, win or lose,
        // unless another concurrent call already started a new one.
        // This logic might need refinement depending on desired concurrency handling.
        // For simplicity, let's clear it here for now.
        // this.connectPromise = null; // Reconsider this based on concurrency needs
    }
  }

  // Example method to perform a findOne operation
  async findOne(collectionName: string, query: Filter<any>, options?: FindOptions): Promise<any> {
     console.log(`[MongoDO ${this.ctx.id}] findOne: Called for collection ${collectionName}`);
     let rawResult: any = null; // Store raw result temporarily
     try {
        await this.ensureConnected();
        if (!this.dbInstance) {
            throw new Error(`[MongoDO ${this.ctx.id}] Database instance not available after connection attempt.`);
        }
        const collection = this.dbInstance.collection(collectionName);
        rawResult = await collection.findOne(query, options); // Get raw result
        console.log(`[MongoDO ${this.ctx.id}] findOne: Raw findOne successful. Found document:`, !!rawResult);

        // ---> START SERIALIZATION FIX <---
        if (rawResult === null) {
            return null; // Return null if nothing found
        }

        // Convert to a plain JSON-serializable object
        const serializableResult = { ...rawResult }; // Shallow copy

        // Explicitly convert ObjectId to string
        if (serializableResult._id instanceof ObjectId) {
             serializableResult._id = serializableResult._id.toString();
        }

        // Add conversions for other BSON types if necessary (Dates are usually fine)
        // e.g., if (serializableResult.someDecimal instanceof Decimal128) { ... }

        return serializableResult; // Return the cleaned object
        // ---> END SERIALIZATION FIX <---

     } catch (error) {
        console.error(`[MongoDO ${this.ctx.id}] findOne: Error during findOne:`, error);
        // Log the raw result if available, might give clues if error happened after findOne
        console.error(`[MongoDO ${this.ctx.id}] findOne: Raw result at time of error:`, rawResult);
        throw error; // Propagate the error
     }
  }

  // Add other methods as needed (e.g., find, insertOne, updateOne, etc.)
  // async find(...) { ... }
  // async insertOne(...) { ... }
} 