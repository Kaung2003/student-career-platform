import { OAuth2Client } from "google-auth-library";

// "Sign in with Google": the browser gets a signed ID token from Google, and we verify it here.

export function googleClientId(): string | null {
  return process.env["GOOGLE_CLIENT_ID"] || null;
}

let client: OAuth2Client | null = null;

export interface GoogleIdentity {
  googleId: string;
  email: string;
  name: string;
}

/** Verifies the token's signature, audience and expiry; returns null if it isn't a usable, verified account. */
export async function verifyGoogleCredential(credential: string): Promise<GoogleIdentity | null> {
  const audience = googleClientId();
  if (!audience) return null;
  client ??= new OAuth2Client(audience);

  const ticket = await client.verifyIdToken({ idToken: credential, audience });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) return null;

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name?.trim() || payload.email.split("@")[0]!,
  };
}
