import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn, signOut, isAllowedEmail } from "@/auth";

export const metadata: Metadata = { title: "Sign in · PVLE Command Center" };

// Renders without any credentials — keep it dynamic so it never prerenders at build.
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  // Already signed in AND still allowed → skip the gate. Mirror the proxy's allow-rule
  // exactly (allowed, or email unreadable) so a de-listed session-holder is NOT bounced
  // to "/" only to be redirected right back here — that would loop.
  const session = await auth();
  const sessionEmail = session?.user?.email;
  const stillAllowed = sessionEmail == null || isAllowedEmail(sessionEmail);
  if (session?.user && stillAllowed) redirect("/");

  const sp = await searchParams;
  // Only honor same-origin relative callbacks (guard against open-redirect via ?callbackUrl=).
  const callbackUrl =
    typeof sp.callbackUrl === "string" && sp.callbackUrl.startsWith("/") && !sp.callbackUrl.startsWith("//")
      ? sp.callbackUrl
      : "/";
  // A leftover session whose email is no longer on the allowlist (access was revoked).
  const revoked = !!session?.user && !stillAllowed;
  const denied = !!sp.error || revoked; // signIn callback denied, OAuth error, or revoked

  return (
    <main className="signin">
      <div className="signin-card">
        <div className="signin-eye">Pura Vida Legacy Ecosystem</div>
        <h1 className="signin-title">Command Center</h1>
        <p className="signin-sub">Private workspace. Sign in with an approved Google account to continue.</p>

        {denied && (
          <div className="signin-error" role="alert">
            {revoked
              ? "Your access to this workspace has been removed. Sign in with an approved account, or contact an admin if this is a mistake."
              : "That account isn’t on the approved list. Ask an admin to add your email, then try again."}
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button type="submit" className="signin-btn">
            <GoogleGlyph />
            Sign in with Google
          </button>
        </form>

        {revoked && (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/signin" });
            }}
          >
            <button type="submit" className="signin-link">
              Sign out of the removed account
            </button>
          </form>
        )}

        <div className="signin-foot">Access restricted to the PVLE team</div>
      </div>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.33Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
