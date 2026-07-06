import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";

// Global app-bar shown on every authenticated page. Renders nothing when signed out, so
// the /signin page stays clean. Server component → reads the session directly (no client
// SessionProvider needed). Styles live in src/app/auth.css (imported globally by layout).
export default async function UserMenu() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;

  return (
    <div className="appbar">
      <span className="appbar-brand">PVLE Command Center</span>
      <div className="appbar-user">
        <span className="appbar-email" title={user.email ?? ""}>
          {user.email}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <button type="submit" className="appbar-signout" aria-label="Sign out">
            <LogOut size={13} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
