import { NextResponse, URLPattern } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from '@/lib/utils';
import apiError from '@/lib/apiError';
import { FirebaseAdmin, FirebaseAuthError, DecodedIdToken } from '@/lib/firebase-admin';

// NOTE: Middleware has too many bugs with app router and pages directory in dev mode. So, using custom server.
// Bugs like out-of-memory and frequent logout issue.
const IS_DEV = process.env.NODE_ENV === 'development';

// --- Firebase Admin Initialization (Middleware Scope) ---
let firebaseAdmin: FirebaseAdmin;

function initializeFirebaseAdmin() {
    if (firebaseAdmin) {
        return; // Already initialized
    }
    console.log('[Middleware] Attempting Firebase Admin initialization...');
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!projectId || !serviceAccountJson) {
        console.error('[Middleware] Firebase Admin environment variables missing.');
        throw new Error('Firebase Admin configuration missing in environment variables.');
    }
    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        firebaseAdmin = new FirebaseAdmin({ projectId, serviceAccount });
        console.log('[Middleware] Firebase Admin initialized successfully.');
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('[Middleware] Failed to initialize Firebase Admin:', message);
        throw new Error(`Server configuration error during Firebase init: ${message}`);
    }
}
// --- End Firebase Admin Initialization ---

function redirect(req: NextRequest, path: string) {
  // see: https://nextjs.org/docs/messages/middleware-relative-urls
  return NextResponse.redirect(new URL(path, req.url));
}

const localHostnames = ['localhost', '0.0.0.0', '127.0.0.1'];

export async function middleware(req: NextRequest) {
  // Because cloud run terminate TLS to container service which means we can't use https://localhost:{port}. So we need to use `http`. Upto next v13.4.12, it's all good and we can directly use `req.nextUrl.origin` for baseUrl. But after that, next.js has unsolved bug which if we used via proxy (via cloudflare tunnel or in production), it out `req.url` with `https://`.
  // I've mentioned this bug here (closed now but not fixed): https://github.com/vercel/next.js/issues/54961
  // Watch for these issues:
  // <https://github.com/vercel/next.js/issues/54450>
  const hostname = req.nextUrl.hostname;
  const isLocal = localHostnames.includes(hostname);
  const baseUrl = isLocal ? `http://${req.nextUrl.host}` : req.nextUrl.origin;
  const pathname = req.nextUrl.pathname;

  // production checklist: <https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy>
  // Disable iframe (better alt to X-Frame-Options)
  const cspHeader = `
    frame-ancestors 'self';  
  `;
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim();

  const res = NextResponse.next();

  // set security headers
  res.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);

  const authRoutes = [
    '/login',
    '/signup',
    '/reset',
    '/forget-pass',
    '/reset-pass',
    '/verify-email',
    '/recover-email',
  ];

  const excludedRoutes = ['/api/lemon', '/api/hc', '/api/hello'].map(
    (r) => new URLPattern({ pathname: r, baseURL: baseUrl, search: '*', hash: '*' })
  );

  // skip these routes.
  // Don't use r.test(req.url), otherwise we will not be able to use cloudflare tunnel for testing webhook locally.
  // check here: console.log('Pathname: ', pathname, baseUrl, req.url, req.nextUrl.origin);
  if (excludedRoutes.some((r) => r.test(pathname, baseUrl))) return res;

  console.log(`<Called Middleware: ${req.url}>`);

  // handle auth firebase handler.
  if (pathname === '/auth/action') {
    const sp = req.nextUrl.searchParams;
    const mode = sp.get('mode');
    const code = sp.get('oobCode');

    switch (mode) {
      case 'signIn':
        return redirect(req, `/signup?code=${code}`);
      case 'resetPassword':
        return redirect(req, `/reset-pass?code=${code}`);
      case 'verifyEmail':
        return redirect(req, `/verify-email?code=${code}`);
      case 'recoverEmail':
        // This happen, when user accidently change their current email address to new. So they can recover their old email from link sent to old email by firebase automatically.
        return redirect(req, `/recover-email?code=${code}`);
      default:
        return NextResponse.next();
    }
  }

  // --- Initialize Firebase Admin --- Try/catch block for robust error handling
  try {
    initializeFirebaseAdmin();
  } catch (initError: unknown) {
    const message = initError instanceof Error ? initError.message : 'Initialization failed';
    console.error('[Middleware] Initialization check failed:', message);
    // For API routes, return JSON error; for others, maybe redirect or show error page?
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Server configuration error', details: message }, { status: 500 });
    }
    // Consider a redirect to an error page for non-API routes
    // return redirect(req, '/error?code=500');
    // For simplicity now, allow request to proceed but it will likely fail later
    console.warn('[Middleware] Proceeding without initialized Firebase Admin.')
    // Or return generic error response:
    // const resError = NextResponse.next();
    // resError.status = 500; return resError;
  }
  // --- End Initialization Check ---

  // --- Direct Token Verification --- Get token
  const token = getToken(req.headers);
  let decodedToken: DecodedIdToken | null = null;
  let verificationError: Error | null = null;

  if (token && firebaseAdmin) { // Check if admin is initialized
    try {
      decodedToken = await firebaseAdmin.verifyIdToken(token); // Set checkRevoked if needed
    } catch (error: unknown) {
      console.error('[Middleware] Token verification failed:', error);
      if (error instanceof FirebaseAuthError) {
        verificationError = error;
      } else {
        verificationError = new Error('Unknown verification error');
      }
    }
  } else if (!token) {
    verificationError = new Error('No token provided');
  } else { // firebaseAdmin not initialized
    verificationError = new Error('Firebase Admin not initialized');
  }
  // --- End Direct Token Verification ---

  const isTokenValid = !!decodedToken && !verificationError;
  const isEmailVerified = decodedToken?.email_verified === true;

  if (pathname.startsWith('/api')) {
    if (!isTokenValid) {
      const status = (verificationError instanceof FirebaseAuthError && (verificationError.code === 'id-token-expired' || verificationError.code === 'id-token-revoked')) ? 401 : 403;
      return apiError({ status: status, message: verificationError?.message || 'Unauthorized' });
    }
    if (!isEmailVerified) {
      console.log('[Middleware] Token revoked[api] (email not verified): ', decodedToken.uid);
      // Directly revoke tokens if email is not verified
      try {
        await firebaseAdmin.revokeRefreshTokens(decodedToken.uid);
      } catch (revokeErr) {
        console.error("[Middleware] Failed to revoke token during API email check:", revokeErr);
        // Decide if failure to revoke should block the request - likely not
      }
      return apiError({ status: 401, message: 'Email not verified' });
    }

    // Add uid and iat to headers for downstream API routes
    res.headers.set('x-uid', decodedToken.uid);
    if (decodedToken.iat) {
      res.headers.set('x-iat', decodedToken.iat.toString());
    }
    return res;
  } else {
    if (!isTokenValid) {
      // token is invalid or not found.
      // also skip /try route.
      if (['/try', ...authRoutes].includes(pathname)) return res;
      else return redirect(req, '/login');
    }
    if (!isEmailVerified) {
      // this will prevent, too-many-redirects error.
      console.log('[Middleware] Token revoked[route] (email not verified): ', decodedToken.uid);
      // Directly revoke tokens if email is not verified
      try {
        await firebaseAdmin.revokeRefreshTokens(decodedToken.uid);
      } catch (revokeErr) {
        console.error("[Middleware] Failed to revoke token during route email check:", revokeErr);
      }
      if (authRoutes.includes(pathname)) return res;
      else return redirect(req, '/login');
    }

    // if loggedIn user try to access auth routes, redirect to home page.
    // make sure to test against baseUrl instead of url or originalUrl.
    // if loggedIn, then skip `/try` route.
    // TODO: Redirect to space-id. We will save personal space-id in custom claim for faster access. Need it to sync with mongodb though.
    if (['/try', ...authRoutes].includes(pathname)) return redirect(req, '/');
    return res;
  }
}

export const config = {
  matcher: [
    // for auth verification (firebase)
    '/auth/action',
    // match all API routes except /api/(verify|revoke|image|hc|lemon)
    // see this for double parentheses: https://nextjs.org/docs/messages/invalid-route-source
    // '/api/((?!verify|revoke|image|hc|lemon).*)',
    '/api/(.*)',
    // match all routes that don't start with _next/ or these file extensions.
    '/((?!_next|[^.]*\\.(?:png|webp|avif|svg|jpeg|jpg|ico|gif|pdf|txt|json|xml|htm|html|css|scss|js|woff2|woff)).*)',
  ],
};
