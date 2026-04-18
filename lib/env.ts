export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Comma-separated admin emails — server-side only (API routes). */
export function adminEmailsServer(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined) {
  if (!email) return false;
  const list = adminEmailsServer();
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}
