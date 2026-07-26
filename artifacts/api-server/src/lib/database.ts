import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../../../../btc_vpn.sqlite");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
    seedData(_db);
    logger.info({ path: DB_PATH }, "SQLite database ready");
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      data_limit_mb INTEGER DEFAULT 10240,
      expiry_date TEXT
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      device_model TEXT,
      device_os TEXT,
      is_banned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, device_id)
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      logo_url TEXT,
      prefixes TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      server_number INTEGER DEFAULT 1,
      display_name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER DEFAULT 443,
      protocol TEXT DEFAULT 'HTTP',
      server_type TEXT DEFAULT 'standard',
      sni_hostname TEXT NOT NULL,
      payload TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS spoof_urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

function seedData(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
  if (count > 0) return;

  logger.info("Seeding initial data...");

  // Use bcrypt-compatible hash. For dev we store a known bcrypt hash for "password"
  // $2b$10$eImiTXuWVxfM37uY4JANjQ== → password
  // We'll store it as a plain marker and compare with our custom verify
  const adminHash = hashPassword("password");
  db.prepare(`INSERT INTO users (username, password, full_name, role, data_limit_mb, expiry_date)
    VALUES (?, ?, ?, 'admin', 102400, '2027-12-31')`).run("admin", adminHash, "مدير النظام");

  db.prepare(`INSERT INTO users (username, password, full_name, role, data_limit_mb, expiry_date)
    VALUES (?, ?, ?, 'user', 10240, '2027-12-31')`).run("demo", hashPassword("demo123"), "مستخدم تجريبي");

  // Companies
  db.prepare(`INSERT INTO companies (name, name_ar, prefixes) VALUES (?, ?, ?)`).run("Vodafone", "فودافون", "010,011");
  db.prepare(`INSERT INTO companies (name, name_ar, prefixes) VALUES (?, ?, ?)`).run("Orange", "اورنج", "012");
  db.prepare(`INSERT INTO companies (name, name_ar, prefixes) VALUES (?, ?, ?)`).run("Etisalat", "اتصالات", "011");
  db.prepare(`INSERT INTO companies (name, name_ar, prefixes) VALUES (?, ?, ?)`).run("WE", "وي", "015");

  // Servers
  db.prepare(`INSERT INTO servers (company_id, server_number, display_name, host, port, protocol, server_type, sni_hostname, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    1, 1, "فودافون 1", "vpn1.btc.com", 443, "HTTP", "standard",
    "web.vodafone.com.eg",
    "GET / HTTP/1.1[crlf]Host: web.vodafone.com.eg[crlf][crlf]"
  );
  db.prepare(`INSERT INTO servers (company_id, server_number, display_name, host, port, protocol, server_type, sni_hostname, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    1, 2, "فودافون 2", "vpn2.btc.com", 80, "HTTP", "standard",
    "eshop.vodafone.com.eg",
    "GET / HTTP/1.1[crlf]Host: eshop.vodafone.com.eg[crlf][crlf]"
  );
  db.prepare(`INSERT INTO servers (company_id, server_number, display_name, host, port, protocol, server_type, sni_hostname, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    2, 1, "اورنج 1", "vpn3.btc.com", 443, "HTTP", "standard",
    "my.orange.eg",
    "GET / HTTP/1.1[crlf]Host: my.orange.eg[crlf][crlf]"
  );
  db.prepare(`INSERT INTO servers (company_id, server_number, display_name, host, port, protocol, server_type, sni_hostname, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    3, 1, "اتصالات 1", "vpn4.btc.com", 443, "HTTP", "standard",
    "my.etisalat.eg",
    "GET / HTTP/1.1[crlf]Host: my.etisalat.eg[crlf][crlf]"
  );
  db.prepare(`INSERT INTO servers (company_id, server_number, display_name, host, port, protocol, server_type, sni_hostname, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    4, 1, "وي 1", "vpn5.btc.com", 443, "HTTP", "standard",
    "my.te.eg",
    "GET / HTTP/1.1[crlf]Host: my.te.eg[crlf][crlf]"
  );

  // Spoof URLs
  const spoofInsert = db.prepare(`INSERT INTO spoof_urls (company_id, url, description) VALUES (?, ?, ?)`);
  spoofInsert.run(1, "web.vodafone.com.eg/portal/homeUtilitiesPromo", "فودافون - الصفحة الرئيسية");
  spoofInsert.run(1, "web.vodafone.com.eg/spa/bf/dlm", "فودافون - DLM");
  spoofInsert.run(1, "eshop.vodafone.com.eg/ar/profile", "فودافون شوب - الملف الشخصي");
  spoofInsert.run(2, "eshop.orange.eg/ar/preorder", "اورنج شوب - الطلب المسبق");
  spoofInsert.run(2, "www.orange.eg/ar/MyAccount/Pages/pay.aspx", "اورنج - الدفع");
  spoofInsert.run(3, "my.etisalat.eg", "اتصالات - حسابي");
  spoofInsert.run(4, "my.te.eg", "وي - حسابي");

  logger.info("Seed data inserted successfully");
}

// Simple password hashing using Node crypto (no bcrypt needed)
import crypto from "crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
