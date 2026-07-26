import { Router, type IRouter } from "express";
import { getDb, verifyPassword, generateToken, hashPassword } from "../lib/database.js";

const router: IRouter = Router();

// POST /api/auth/login
router.post("/auth/login", (req, res) => {
  const { username, password, device_id, device_model, device_os } = req.body ?? {};

  if (!username || !password) {
    res.status(400).json({ success: false, message: "اسم المستخدم وكلمة المرور مطلوبان" });
    return;
  }

  const db = getDb();

  const user = db.prepare(
    "SELECT * FROM users WHERE username = ? AND status = 'active'"
  ).get(username) as any;

  if (!user) {
    res.json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة", banned: false });
    return;
  }

  if (!verifyPassword(password, user.password)) {
    res.json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة", banned: false });
    return;
  }

  // Register/update device if provided
  if (device_id) {
    const existingDevice = db.prepare(
      "SELECT * FROM devices WHERE user_id = ? AND device_id = ?"
    ).get(user.id, device_id) as any;

    if (existingDevice?.is_banned) {
      res.json({ success: false, message: "هذا الجهاز محظور من استخدام التطبيق", banned: true });
      return;
    }

    if (!existingDevice) {
      db.prepare(
        "INSERT INTO devices (user_id, device_id, device_model, device_os) VALUES (?, ?, ?, ?)"
      ).run(user.id, device_id, device_model ?? null, device_os ?? null);
    }
  }

  // Create session token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)"
  ).run(user.id, token, expiresAt);

  res.json({
    success: true,
    message: "تم تسجيل الدخول بنجاح",
    banned: false,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        data_limit_mb: user.data_limit_mb,
        expiry_date: user.expiry_date,
      },
    },
  });
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (token) {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
});

export default router;
