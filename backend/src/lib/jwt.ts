import jwt from "jsonwebtoken";

const rawSecret = process.env["JWT_SECRET"];

if (!rawSecret) {
  throw new Error("JWT_SECRET is not set in the environment");
}

const JWT_SECRET: string = rawSecret;

export interface AuthTokenPayload {
  userId: string;
  role: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}
