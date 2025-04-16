# How to run
- Install `node_modules` using pnpm/yarn/npm.
- Run `pnpn run dev` (for development)

## Deployment Guide

NOTE: Firebase authentication is based on service worker sessions instead of cookies (<https://firebase.google.com/docs/auth/web/service-worker-sessions>). This requires a custom service worker.

To deploy the application to Cloudflare, follow these steps:

1.  **Build the Service Worker:**
Before deploying, you need to build the production version of the service worker. This creates the necessary `sw.js` file in the `/public` directory.
```bash
  pnpm run sw:build-prod
```

2.  **Build and Deploy:**
Use the `deploy` script which handles both building the application specifically for Cloudflare using OpenNextJS and deploying it. The `-- --minify` flag ensures the assets are minified.
```bash
  pnpm run run deploy
```

3.  **Configure Environment Variables (Secrets):**
This application requires MongoDB connection details. You need to set the following environment variables as secrets in your Cloudflare project:
- `MONGODB_URI`: Your MongoDB connection string.
- `MONGODB_DB`: The name of the database to use.

  You can set these secrets using the Wrangler CLI:
```bash
npx wrangler secret put MONGODB_URI
# You will be prompted to enter the secret value

npx wrangler secret put MONGODB_DB
# You will be prompted to enter the secret value
```
Alternatively, you can set these secrets in the Cloudflare dashboard under your Worker's settings.

This command sequence (`opennextjs-cloudflare build && opennextjs-cloudflare deploy -- --minify`) will prepare your Next.js application and push it to your Cloudflare environment.



