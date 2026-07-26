import { Router, type IRouter } from "express";
import { getDb } from "../lib/database.js";

const router: IRouter = Router();

// POST /api/detect-company
// Detects Egyptian mobile operator from phone number prefix
router.post("/detect-company", (req, res) => {
  const { phone_number } = req.body ?? {};

  if (!phone_number) {
    res.status(400).json({ success: false, message: "رقم الهاتف مطلوب", company: null });
    return;
  }

  // Normalize: strip spaces, then convert to local 11-digit format (01XXXXXXXXX)
  let normalized = String(phone_number).replace(/\s+/g, "");
  if (normalized.startsWith("+20")) normalized = "0" + normalized.slice(3);
  else if (normalized.startsWith("20") && normalized.length === 12) normalized = "0" + normalized.slice(2);

  if (normalized.length < 3) {
    res.json({ success: false, message: "رقم الهاتف غير صحيح", company: null });
    return;
  }

  const prefix3 = normalized.slice(0, 3);

  // Egyptian prefix map (3-digit local prefix)
  const prefixMap: Record<string, string> = {
    "010": "Vodafone",
    "011": "Etisalat",
    "012": "Orange",
    "015": "WE",
  };

  const companyName = prefixMap[prefix3] ?? null;

  if (!companyName) {
    res.json({ success: false, message: "لم يتم التعرف على الشبكة", company: null });
    return;
  }

  const db = getDb();
  const company = db.prepare(
    "SELECT id, name, name_ar, logo_url FROM companies WHERE name = ? AND is_active = 1"
  ).get(companyName) as any;

  if (!company) {
    res.json({ success: false, message: "الشبكة غير متاحة حالياً", company: null });
    return;
  }

  res.json({
    success: true,
    message: `تم التعرف على الشبكة: ${company.name_ar}`,
    company,
  });
});

export default router;
