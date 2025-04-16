import 'server-only';
// Import types, not the implementation itself directly unless needed for interface/stub typing
import type { MongoDurableObject } from './mongoDurableObject';
// Use 'any' for potentially missing types or install @cloudflare/workers-types
// import type { DurableObjectNamespace, DurableObjectStub } from '@cloudflare/workers-types';

// Define an interface representing the methods exposed by our DO stub
// Does not extend anything if DurableObjectStub type is unavailable
export interface MongoDOStub /* extends DurableObjectStub */ {
  // Define the methods we expect the stub to have
  findOne(collectionName: string, query: any, options?: any): Promise<any>;
  // Add other method signatures here as you implement them in the DO
  // find(...): Promise<any[]>;
  // insertOne(...): Promise<any>;
  // fetch(urlOrRequest: string | URL | Request, init?: RequestInit<CfProperties<unknown>> | undefined): Promise<Response>; // Add fetch if needed directly
}

// Define the Env structure expected by the function accessing the binding
export interface EnvWithMongoDO {
    // This binding name MUST match the one defined in wrangler.toml / Cloudflare UI
    // Using 'any' for namespace type if DurableObjectNamespace is unavailable
    MONGO_DO: /* DurableObjectNamespace<MongoDurableObject> */ any;
    // Include other env vars if needed by this module, though likely not
}

/**
 * Gets a stub for the singleton MongoDB Durable Object.
 * Uses a fixed name "singleton-mongo-connection" to ensure only one
 * instance of the DO is generally used for managing the connection pool.
 *
 * @param env - The environment object containing the DO binding.
 * @returns A DurableObjectStub for interacting with the MongoDurableObject.
 */
export function getMongoDO(env: EnvWithMongoDO): MongoDOStub {
    if (!env || !env.MONGO_DO) {
        throw new Error("MONGO_DO binding not found in environment. Check wrangler.toml configuration.");
    }
    // Use a fixed name to ensure we always talk to the same DO instance
    // for managing this specific connection pool.
    const id = env.MONGO_DO.idFromName("singleton-mongo-connection");
    // The object returned by .get() should conform to MongoDOStub based on our DO class definition
    const stub = env.MONGO_DO.get(id);
    // Cast to our specific stub type for method intellisense/type checking
    return stub as MongoDOStub;
}

// Remove all previous connection logic (cachedClient, cachedDb, connectToDatabase)
