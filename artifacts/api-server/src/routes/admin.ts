import { Router, type IRouter } from "express";
import { getDb, hashPassword, generateToken } from "../lib/database.js";

const router: IRouter = Router();

// ── Auth middleware for admin routes ──────────────────────────
function requireAuth(req: any, res: any, next: any) {
  const token = (req.headers.authorization ?? "").replace("Bearer ", "").trim();
  if (!token) { res.status(401).json({ success: false, message: "غير مصرح" }); return; }
  const db = getDb();
  const session = db.prepare(
    "SELECT s.user_id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
  ).get(token) as any;
  if (!session) { res.status(401).json({ success: false, message: "انتهت الجلسة" }); return; }
  req.userId = session.user_id;
  req.userRole = session.role;
  next();
}

// ── GET /api/stats ─────────────────────────────────────────────
router.get("/stats", requireAuth, (_req, res) => {
  const db = getDb();
  const users    = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
  const companies= (db.prepare("SELECT COUNT(*) as c FROM companies").get() as any).c;
  const servers  = (db.prepare("SELECT COUNT(*) as c FROM servers").get() as any).c;
  const spoof_urls=(db.prepare("SELECT COUNT(*) as c FROM spoof_urls").get() as any).c;
  const sessions = (db.prepare("SELECT COUNT(*) as c FROM sessions WHERE expires_at > datetime('now')").get() as any).c;
  res.json({ success: true, users, companies, servers, spoof_urls, sessions });
});

// ── Users ──────────────────────────────────────────────────────
router.get("/users", requireAuth, (_req, res) => {
  const db = getDb();
  const data = db.prepare(
    "SELECT id, username, full_name, role, status, data_limit_mb, expiry_date FROM users ORDER BY id"
  ).all();
  res.json({ success: true, data });
});

router.post("/users", requireAuth, (req, res) => {
  const { username, password, full_name, role = "user", data_limit_mb = 10240, expiry_date } = req.body ?? {};
  if (!username || !password) { res.status(400).json({ success: false, message: "username وpassword مطلوبان" }); return; }
  const db = getDb();
  try {
    const hashed = hashPassword(password);
    const result = db.prepare(
      "INSERT INTO users (username, password, full_name, role, data_limit_mb, expiry_date) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(username, hashed, full_name ?? null, role, data_limit_mb, expiry_date ?? null);
    const data = db.prepare("SELECT id, username, full_name, role, status, data_limit_mb, expiry_date FROM users WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: "تم إنشاء المستخدم", data });
  } catch (e: any) {
    res.status(400).json({ success: false, message: "اسم المستخدم موجود بالفعل" });
  }
});

router.patch("/users/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { full_name, password, role, status, data_limit_mb, expiry_date } = req.body ?? {};
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  if (!user) { res.status(404).json({ success: false, message: "المستخدم غير موجود" }); return; }
  const newPass = password ? hashPassword(password) : user.password;
  db.prepare(
    "UPDATE users SET full_name=?, password=?, role=?, status=?, data_limit_mb=?, expiry_date=? WHERE id=?"
  ).run(
    full_name ?? user.full_name,
    newPass,
    role ?? user.role,
    status ?? user.status,
    data_limit_mb ?? user.data_limit_mb,
    expiry_date ?? user.expiry_date,
    id
  );
  const data = db.prepare("SELECT id, username, full_name, role, status, data_limit_mb, expiry_date FROM users WHERE id = ?").get(id);
  res.json({ success: true, message: "تم التحديث", data });
});

router.delete("/users/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM devices WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ success: true, message: "تم الحذف" });
});

// ── Companies ──────────────────────────────────────────────────
router.get("/companies", requireAuth, (_req, res) => {
  const db = getDb();
  const data = db.prepare("SELECT id, name, name_ar, logo_url, prefixes, is_active FROM companies ORDER BY id").all();
  res.json({ success: true, data });
});

router.post("/companies", requireAuth, (req, res) => {
  const { name, name_ar, logo_url, prefixes } = req.body ?? {};
  if (!name || !name_ar) { res.status(400).json({ success: false, message: "name وname_ar مطلوبان" }); return; }
  const db = getDb();
  const result = db.prepare("INSERT INTO companies (name, name_ar, logo_url, prefixes) VALUES (?, ?, ?, ?)").run(name, name_ar, logo_url ?? null, prefixes ?? null);
  const data = db.prepare("SELECT id, name, name_ar, logo_url, prefixes, is_active FROM companies WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ success: true, message: "تم إنشاء الشركة", data });
});

router.delete("/companies/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = getDb();
  db.prepare("DELETE FROM spoof_urls WHERE company_id = ?").run(id);
  db.prepare("DELETE FROM servers WHERE company_id = ?").run(id);
  db.prepare("DELETE FROM companies WHERE id = ?").run(id);
  res.json({ success: true, message: "تم الحذف" });
});

// ── Servers (admin version — lists all, no token gate per-company) ──
router.post("/servers", requireAuth, (req, res) => {
  const { company_id, server_number = 1, display_name, host, port = 443, protocol = "HTTP", server_type = "standard", sni_hostname, payload } = req.body ?? {};
  if (!company_id || !display_name || !host || !sni_hostname || !payload) {
    res.status(400).json({ success: false, message: "بيانات السيرفر غير مكتملة" }); return;
  }
  const db = getDb();
  const result = db.prepare(
    "INSERT INTO servers (company_id, server_number, display_name, host, port, protocol, server_type, sni_hostname, payload) VALUES (?,?,?,?,?,?,?,?,?)"
  ).run(company_id, server_number, display_name, host, port, protocol, server_type, sni_hostname, payload);
  const data = db.prepare(
    "SELECT s.*, c.name as company_name FROM servers s JOIN companies c ON s.company_id=c.id WHERE s.id=?"
  ).get(result.lastInsertRowid);
  res.status(201).json({ success: true, message: "تم إنشاء السيرفر", data });
});

router.delete("/servers/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = getDb();
  db.prepare("DELETE FROM servers WHERE id = ?").run(id);
  res.json({ success: true, message: "تم الحذف" });
});

// ── Spoof URLs (admin full list) ───────────────────────────────
router.get("/spoof-urls", requireAuth, (_req, res) => {
  const db = getDb();
  const data = db.prepare(
    "SELECT s.id, s.company_id, s.url, s.description, s.is_active, c.name as company_name FROM spoof_urls s JOIN companies c ON s.company_id=c.id ORDER BY s.company_id, s.id"
  ).all();
  res.json({ success: true, data });
});

router.post("/spoof-urls", requireAuth, (req, res) => {
  const { company_id, url, description } = req.body ?? {};
  if (!company_id || !url) { res.status(400).json({ success: false, message: "company_id وurl مطلوبان" }); return; }
  const db = getDb();
  const result = db.prepare("INSERT INTO spoof_urls (company_id, url, description) VALUES (?, ?, ?)").run(company_id, url, description ?? null);
  const data = db.prepare("SELECT s.*, c.name as company_name FROM spoof_urls s JOIN companies c ON s.company_id=c.id WHERE s.id=?").get(result.lastInsertRowid);
  res.status(201).json({ success: true, message: "تم الإضافة", data });
});

router.delete("/spoof-urls/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = getDb();
  db.prepare("DELETE FROM spoof_urls WHERE id = ?").run(id);
  res.json({ success: true, message: "تم الحذف" });
});

export default router;
