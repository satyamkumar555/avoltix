// Usage: node scripts/set-admin.mjs you@example.com
// Needs GOOGLE_APPLICATION_CREDENTIALS pointing to a service-account JSON (never commit that file).
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) { console.error("Usage: node scripts/set-admin.mjs <email>"); process.exit(1); }
initializeApp({ credential: applicationDefault() });
const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { admin: true });
console.log(`${email} is now an admin. Sign out and sign in again for it to take effect.`);
