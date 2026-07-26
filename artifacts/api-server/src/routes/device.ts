import { Router, type IRouter } from "express";
import { getDb } from "../lib/database.js";

const router: IRouter = Router();

// POST /api/device/check
router.post("/device/check", (req, res) => {
  const { username, device_id, device_model, device_os } = req.body ?? {};

  if (!username || !device_id) {
    res.status(400).json({ success: false, message: "بيانات الجهاز مطلوبة", banned: false, data: null });
    return;
  }

  const db = getDb();

  const user = db.prepare(
    "SELECT id, username, expiry_date, status FROM users WHERE username = ?"
  ).get(username) as any;

  if (!user) {
    res.json({ success: false, message: "المستخدم غير موجود", banned: false, data: null });
    return;
  }

  if (user.status !== "active") {
    res.json({ success: false, message: "الحساب غير نشط", banned: false, data: null });
    return;
  }

  const device = db.prepare(
    "SELECT * FROM devices WHERE user_id = ? AND device_id = ?"
  ).get(user.id, device_id) as any;

  if (device?.is_banned) {
    res.json({ success: false, message: "هذا الجهاز محظور", banned: true, data: null });
    return;
  }

  if (!device) {
    db.prepare(
      "INSERT INTO devices (user_id, device_id, device_model, device_os) VALUES (?, ?, ?, ?)"
    ).run(user.id, device_id, device_model ?? null, device_os ?? null);
  }

  res.json({
    success: true,
    message: "الجهاز مسجل ونشط",
    banned: false,
    data: {
      user_id: user.id,
      username: user.username,
      expiry_date: user.expiry_date,
    },
  });
});

export default router;
