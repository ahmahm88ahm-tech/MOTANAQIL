import { Router, type IRouter } from "express";
import { getDb } from "../lib/database.js";

const router: IRouter = Router();

function resolveSession(authHeader: string) {
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  const db = getDb();
  const session = db.prepare(
    "SELECT s.user_id, u.id, u.username, u.full_name, u.data_limit_mb, u.expiry_date FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
  ).get(token) as any;
  return session ?? null;
}

// GET /api/servers
router.get("/servers", (req, res) => {
  const session = resolveSession(req.headers.authorization ?? "");
  if (!session) {
    res.status(401).json({ success: false, message: "غير مصرح أو انتهت الجلسة" });
    return;
  }

  const db = getDb();

  const companies = db.prepare(
    "SELECT id, name, name_ar, logo_url FROM companies WHERE is_active = 1"
  ).all() as any[];

  const servers = db.prepare(
    `SELECT s.id, s.company_id, s.server_number, s.display_name, s.host, s.port,
            s.protocol, s.server_type, s.sni_hostname, s.payload, c.name as company_name
     FROM servers s JOIN companies c ON s.company_id = c.id
     WHERE s.is_active = 1 ORDER BY s.company_id, s.server_number`
  ).all() as any[];

  const spoofRaw = db.prepare(
    "SELECT company_id, url, description FROM spoof_urls WHERE is_active = 1"
  ).all() as any[];

  // Group spoof_urls by company_id as string (matches Android: Map<String, List<SpoofUrl>>)
  const spoof_urls: Record<string, { url: string; description: string | null }[]> = {};
  for (const row of spoofRaw) {
    const key = String(row.company_id);
    if (!spoof_urls[key]) spoof_urls[key] = [];
    spoof_urls[key].push({ url: row.url, description: row.description });
  }

  res.json({
    success: true,
    companies,
    servers,
    spoof_urls,
    user: {
      id: session.id,
      username: session.username,
      full_name: session.full_name,
      data_limit_mb: session.data_limit_mb,
      expiry_date: session.expiry_date,
    },
  });
});

export default router;
