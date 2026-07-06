// The login gate for EVERY route.
//
// Next 16 renamed the middleware file convention to `proxy` (function named `proxy` or a
// default export) and runs it on the Node.js runtime — so importing the full auth config
// (Google provider + env reads) here is fine; no edge-split needed.
import { auth, isAllowedEmail } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (req.auth) {
    // Re-check the allowlist on EVERY request, not just at sign-in, so removing someone
    // from ALLOWED_EMAILS revokes them on their next request instead of leaving a valid
    // JWT usable for its ~30-day lifetime. Fail-safe: if a valid session somehow carries
    // no email, fall back to trusting the sign-in-time gate (never lock out a
    // legitimately signed-in user over a missing claim).
    const email = req.auth.user?.email;
    if (email == null || isAllowedEmail(email)) return; // authed & still allowed → continue
  }

  const { pathname, search, origin } = req.nextUrl;

  // API routes: a fetch/XHR can't meaningfully follow a redirect to an HTML page, so
  // answer with a JSON 401 instead of bouncing to /signin.
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pages: redirect to the branded sign-in, remembering the intended destination.
  const url = new URL("/signin", origin);
  url.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(url);
});

export const config = {
  // Protect everything EXCEPT: NextAuth's own endpoints (/api/auth/*), the sign-in page,
  // and Next internals / static assets. Real API routes (/api/pipeline, /api/drive, …)
  // stay matched, so they are protected.
  matcher: ["/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)"],
};
