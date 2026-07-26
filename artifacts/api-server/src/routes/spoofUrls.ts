import { Router, type IRouter } from "express";
import { getDb } from "../lib/database.js";

const router: IRouter = Router();

function resolveSession(authHeader: string) {
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  const db = getDb();
  return db.prepare(
    "SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')"
  ).get(token) ?? null;
}

// GET /api/spoof-urls/company/:companyId
router.get("/spoof-urls/company/:companyId", (req, res) => {
  const session = resolveSession(req.headers.authorization ?? "");
  if (!session) {
    res.status(401).json({ success: false, message: "غير مصرح أو انتهت الجلسة", urls: [] });
    return;
  }

  const companyId = parseInt(req.params.companyId, 10);
  if (isNaN(companyId)) {
    res.status(400).json({ success: false, message: "معرف الشركة غير صحيح", urls: [] });
    return;
  }

  const db = getDb();
  const urls = db.prepare(
    "SELECT url, description FROM spoof_urls WHERE company_id = ? AND is_active = 1"
  ).all(companyId) as any[];

  res.json({ success: true, urls });
});

export default router;
