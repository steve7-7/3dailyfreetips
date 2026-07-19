import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "fp_session";
const ALG = "HS256";
const EXPIRES_IN = "7d";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    "fp_dev_super_secret_change_in_production_e3b0c44298fc1c14";
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .setIssuer("football-predictions")
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined,
): Promise<{ sub: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "football-predictions",
    });
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}
