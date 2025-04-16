
import { MongoDurableObject } from './lib/mongoDurableObject';
import { default as handler } from './.open-next/worker.js';

// --- 1. Export your Durable Object Class ---
// This makes it visible to the Cloudflare runtime via the binding
export { MongoDurableObject };

// --- 3. Define the main fetch handler ---
export default {
  fetch: handler.fetch,

  
} satisfies ExportedHandler<CloudflareEnv>;


export { DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';