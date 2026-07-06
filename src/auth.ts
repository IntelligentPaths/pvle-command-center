// User sign-in — Auth.js / NextAuth v5 (the LOGIN GATE for humans).
//
// This is a SEPARATE concern from src/lib/google.ts. That file is the service-account /
// Workload-Identity-Federation path that reads the Sheet & Drive (machine "data auth").
// This file authenticates *people* via their own Google account and gates access. Do not
// conflate them: AUTH_GOOGLE_* here is an OAuth *client* for users; GOOGLE_* / crm-sheets
// over there is the machine identity for data. google.ts is left completely untouched.
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Comma-separated allowlist from env, normalized to lowercase. Empty/unset → deny-all
// (fail closed): a misconfigured allowlist locks everyone out rather than letting anyone in.
function allowlist(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  const e = email?.trim().toLowerCase();
  return !!e && allowlist().includes(e);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google], // credentials auto-read from AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
  session: { strategy: "jwt" }, // no DB adapter — stateless JWT sessions
  pages: { signIn: "/signin" }, // branded cockpit sign-in (also where denials land)
  callbacks: {
    // The gate. Runs on every sign-in attempt; returning false denies and bounces the
    // user to /signin?error=AccessDenied. Only a verified Google email on the allowlist
    // is admitted.
    signIn({ user, account, profile }) {
      if (account?.provider !== "google") return false;
      // Google sets email_verified; reject an explicitly-unverified email. (If the claim
      // is absent we don't hard-block — the allowlist is still the real gate.)
      if (profile?.email_verified === false) return false;
      return isAllowedEmail(user.email);
    },
  },
});
