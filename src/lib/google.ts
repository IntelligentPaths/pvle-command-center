// Keyless Google auth — NO service-account key file, ever.
//
//   Local dev:  Application Default Credentials (the signed-in user) → impersonate crm-sheets.
//   Production: Workload Identity Federation issues creds that impersonate the same SA.
//
// When GOOGLE_IMPERSONATE_SERVICE_ACCOUNT is set, the source credentials mint a
// short-lived access token for that service account via the IAM Credentials API.
import { google } from "googleapis";
import { GoogleAuth, Impersonated } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly",
];

async function resolveAuth() {
  const target = process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT;

  // No impersonation configured → use ADC directly with the app scopes.
  if (!target) {
    return new GoogleAuth({ scopes: SCOPES });
  }

  // Impersonation: the source client (local ADC user, or federated creds in prod)
  // mints a short-lived token for `target`. The source needs cloud-platform scope
  // to call the IAM Credentials API, and the caller needs
  // roles/iam.serviceAccountTokenCreator on `target`.
  const source = await new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  }).getClient();

  return new Impersonated({
    sourceClient: source,
    targetPrincipal: target,
    targetScopes: SCOPES,
    lifetime: 3600,
  });
}

// Resolve auth once and reuse it; retry on the next request if resolution failed.
let authPromise: ReturnType<typeof resolveAuth> | null = null;
function getAuth() {
  if (!authPromise) {
    authPromise = resolveAuth().catch((err) => {
      authPromise = null;
      throw err;
    });
  }
  return authPromise;
}

export async function getSheets() {
  return google.sheets({ version: "v4", auth: await getAuth() });
}

export async function getDrive() {
  return google.drive({ version: "v3", auth: await getAuth() });
}
