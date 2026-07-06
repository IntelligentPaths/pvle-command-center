// Keyless Google auth — NO service-account key file, ever. Both paths resolve to an
// AuthClient with the same shape, so getSheets()/getDrive() (and everything downstream)
// are identical regardless of environment.
//
//   Production (Vercel): request-scoped OIDC token → Google Workload Identity Federation
//                        (STS token exchange) → impersonate crm-sheets.
//   Local dev:          Application Default Credentials (signed-in user) → impersonate crm-sheets.
import { google } from "googleapis";
import { ExternalAccountClient, GoogleAuth, Impersonated } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly",
];

async function resolveAuth() {
  // --- Production: Vercel OIDC → Google Workload Identity Federation → impersonate crm-sheets ---
  // Keyless: Vercel mints a short-lived OIDC token per request; GCP's STS exchanges it (via the
  // workload identity pool provider) for a federated token that then impersonates the SA.
  if (process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN) {
    const audience = `https://iam.googleapis.com/projects/${process.env.GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${process.env.GCP_WORKLOAD_IDENTITY_POOL_ID}/providers/${process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`;
    const client = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
      subject_token_supplier: {
        // Hand Vercel's per-request OIDC token to STS as the subject token.
        getSubjectToken: async () => await getVercelOidcToken(),
      },
      scopes: SCOPES,
    });
    if (!client) throw new Error("Failed to build ExternalAccountClient for Vercel OIDC → WIF");
    console.info(
      "[google] auth mode: Vercel OIDC → Workload Identity Federation → impersonate",
      process.env.GCP_SERVICE_ACCOUNT_EMAIL,
    );
    return client;
  }

  // --- Local dev: Application Default Credentials → impersonate crm-sheets (unchanged) ---
  const target = process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT;

  // No impersonation configured → use ADC directly with the app scopes.
  if (!target) {
    return new GoogleAuth({ scopes: SCOPES });
  }

  // Impersonation: the source client (local ADC user) mints a short-lived token for
  // `target`. The source needs cloud-platform scope to call the IAM Credentials API,
  // and the caller needs roles/iam.serviceAccountTokenCreator on `target`.
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
