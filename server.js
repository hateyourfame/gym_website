"use strict";

const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const Database = require("better-sqlite3");

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "progym-dev-secret-change-me";
const SALT_ROUNDS = 10;
const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "progym.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    plan_name TEXT,
    subscription_end TEXT NOT NULL,
    trainings_remaining INTEGER NOT NULL DEFAULT 0 CHECK (trainings_remaining >= 0),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_names ON users (last_name, first_name);

  CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS zone_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_key TEXT NOT NULL,
    caption TEXT NOT NULL,
    image_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_zone_photos_key ON zone_photos (zone_key, id);
`);

const DEFAULT_TRAINERS = [
  { name: "Дмитрий Павлов", role: "Персональный тренер", bio: "Индивидуальные программы под цели: масса, сушка, техника базовых движений." },
  { name: "Александр Кисткин", role: "Персональный тренер", bio: "Сопровождение на тренажёрах и со свободными весами." },
  { name: "Владимир Садчиков", role: "Зал и групповые", bio: "Связка силового зала и групповых форматов для сбалансированной нагрузки." },
  { name: "Андрей Кузнецов", role: "Персональный тренер", bio: "Постановка техники и планирование тренировочного цикла." },
  { name: "Андрей Попович", role: "Персональный тренер", bio: "Работа с разным уровнем подготовки, мотивация и дисциплина на тренировке." },
  { name: "Антон Царюк", role: "Персональный тренер", bio: "Фокус на результат и безопасную прогрессию нагрузок." },
  { name: "Юлия", role: "Групповые программы", bio: "Энергичные занятия в зале аэробики и смежных форматах." },
  { name: "Анастасия", role: "Групповые программы", bio: "Сборные тренировки для тех, кто любит групповой драйв." },
  { name: "Анна", role: "Группы · хореография · персонал", bio: "Танцевальные направления и персональные сессии." },
  { name: "Валерия Халяпина", role: "Группы и персонал", bio: "Комбинация групповых и индивидуальных форматов." },
  { name: "Ксения Борисоглебская", role: "Групповые программы", bio: "Разнообразие групповых классов на любой вкус." },
];

const ZONE_DEFS = {
  strength: { key: "strength", title: "Силовая зона", ariaLabel: "Открыть галерею: силовая зона" },
  boxing: { key: "boxing", title: "Бокс", ariaLabel: "Открыть галерею: бокс" },
  reception: { key: "reception", title: "Ресепшен", ariaLabel: "Открыть галерею: ресепшен" },
  group_halls: { key: "group_halls", title: "Групповые залы", ariaLabel: "Открыть галерею: групповые залы" },
};

const DEFAULT_ZONE_PHOTOS = [
  { zoneKey: "strength", caption: "Общий вид зала" },
  { zoneKey: "strength", caption: "Рамы и платформы" },
  { zoneKey: "strength", caption: "Гантели и штанги" },
  { zoneKey: "strength", caption: "Зона приседов и тяги" },
  { zoneKey: "boxing", caption: "Ринг и канаты" },
  { zoneKey: "boxing", caption: "Мешки и лапы" },
  { zoneKey: "boxing", caption: "Зона парной работы" },
  { zoneKey: "boxing", caption: "Общий вид" },
  { zoneKey: "reception", caption: "Стойка администратора" },
  { zoneKey: "reception", caption: "Зона ожидания" },
  { zoneKey: "reception", caption: "Камеры хранения" },
  { zoneKey: "reception", caption: "Информация для гостей" },
  { zoneKey: "group_halls", caption: "Зал с зеркалами" },
  { zoneKey: "group_halls", caption: "Степ и покрытие" },
  { zoneKey: "group_halls", caption: "Общий вид зала" },
  { zoneKey: "group_halls", caption: "Групповое занятие" },
];

function seedAdmin() {
  const row = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (row) return;
  const email = "admin@progym.local";
  const password = "Admin123!";
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const info = db
    .prepare(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
       VALUES (?, ?, ?, ?, ?, 'admin')`
    )
    .run(email, hash, "Администратор", "Клуба", "+79939167575");
  const end = new Date();
  end.setMonth(end.getMonth() + 12);
  db.prepare(
    `INSERT INTO memberships (user_id, plan_name, subscription_end, trainings_remaining)
     VALUES (?, ?, ?, ?)`
  ).run(info.lastInsertRowid, "Служебная", end.toISOString().slice(0, 10), 999);
  console.log("Создан администратор:", email, "/", password);
}

seedAdmin();

function seedTrainers() {
  const row = db.prepare("SELECT id FROM trainers LIMIT 1").get();
  if (row) return;
  const ins = db.prepare("INSERT INTO trainers (name, role, bio) VALUES (?, ?, ?)");
  const tx = db.transaction((items) => {
    items.forEach((item) => ins.run(item.name, item.role, item.bio));
  });
  tx(DEFAULT_TRAINERS);
}

function seedZonePhotoPlaceholders() {
  const row = db.prepare("SELECT id FROM zone_photos LIMIT 1").get();
  if (row) return;
  const ins = db.prepare("INSERT INTO zone_photos (zone_key, caption, image_path) VALUES (?, ?, NULL)");
  const tx = db.transaction((items) => {
    items.forEach((item) => ins.run(item.zoneKey, item.caption));
  });
  tx(DEFAULT_ZONE_PHOTOS);
}

seedTrainers();
seedZonePhotoPlaceholders();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(
  session({
    name: "progym.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

function rowToUserPublic(row, membership) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    membership: membership
      ? {
          planName: membership.plan_name,
          subscriptionEnd: membership.subscription_end,
          trainingsRemaining: membership.trainings_remaining,
        }
      : null,
  };
}

function getMembership(userId) {
  return db.prepare("SELECT * FROM memberships WHERE user_id = ?").get(userId);
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Требуется вход" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Требуется вход" });
  }
  const u = db.prepare("SELECT role FROM users WHERE id = ?").get(req.session.userId);
  if (!u || u.role !== "admin") {
    return res.status(403).json({ error: "Нет доступа" });
  }
  next();
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function saveImageFromDataUrl(dataUrl, targetDirAbs, nameBase) {
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("Изображение не передано");
  }
  const m = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,([\s\S]+)$/i);
  if (!m) {
    throw new Error("Поддерживаются только PNG, JPG, WEBP и GIF в формате base64");
  }
  const ext = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
  const bin = Buffer.from(m[2], "base64");
  if (!bin.length || Number.isNaN(bin.length)) {
    throw new Error("Файл изображения пустой");
  }
  if (bin.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Файл слишком большой (максимум 6 МБ)");
  }
  ensureDir(targetDirAbs);
  const stamp = Date.now();
  const safeName = slugify(nameBase) || "image";
  const fileName = `${safeName}-${stamp}.${ext}`;
  const absPath = path.join(targetDirAbs, fileName);
  fs.writeFileSync(absPath, bin);
  return fileName;
}

function getZonesPayload() {
  const rows = db
    .prepare("SELECT id, zone_key, caption, image_path FROM zone_photos ORDER BY zone_key, id")
    .all();
  const byZone = {};
  Object.keys(ZONE_DEFS).forEach((key) => {
    byZone[key] = [];
  });
  rows.forEach((row) => {
    if (!ZONE_DEFS[row.zone_key]) return;
    byZone[row.zone_key].push({
      id: row.id,
      caption: row.caption,
      src: row.image_path || "",
    });
  });
  return Object.values(ZONE_DEFS).map((zone) => ({
    key: zone.key,
    title: zone.title,
    ariaLabel: zone.ariaLabel,
    slides: byZone[zone.key] || [],
  }));
}

app.get("/api/trainers", (req, res) => {
  const trainers = db.prepare("SELECT id, name, role, bio FROM trainers ORDER BY id").all();
  res.json({ trainers });
});

app.post("/api/register", (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body || {};
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "Укажите email, пароль, имя и фамилию" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Пароль не короче 6 символов" });
  }
  const normEmail = String(email).trim().toLowerCase();
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(normEmail);
  if (exists) {
    return res.status(409).json({ error: "Этот email уже зарегистрирован" });
  }
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  let userId;
  try {
    const info = db
      .prepare(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
         VALUES (?, ?, ?, ?, ?, 'client')`
      )
      .run(normEmail, hash, String(firstName).trim(), String(lastName).trim(), phone ? String(phone).trim() : null);
    userId = info.lastInsertRowid;
  } catch (e) {
    return res.status(500).json({ error: "Не удалось создать аккаунт" });
  }
  const end = new Date();
  end.setDate(end.getDate() + 30);
  db.prepare(
    `INSERT INTO memberships (user_id, plan_name, subscription_end, trainings_remaining)
     VALUES (?, ?, ?, ?)`
  ).run(userId, "Старт (после регистрации)", end.toISOString().slice(0, 10), 3);

  req.session.userId = userId;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  const m = getMembership(userId);
  res.json({ user: rowToUserPublic(user, m) });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }
  req.session.userId = user.id;
  const m = getMembership(user.id);
  res.json({ user: rowToUserPublic(user, m) });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.json({ user: null });
  }
  const m = getMembership(user.id);
  res.json({ user: rowToUserPublic(user, m) });
});

app.get("/api/admin/users", requireAdmin, (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) {
    return res.json({ users: [] });
  }
  const like = `%${q}%`;
  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at,
              m.plan_name, m.subscription_end, m.trainings_remaining
       FROM users u
       LEFT JOIN memberships m ON m.user_id = u.id
       WHERE u.first_name LIKE ? OR u.last_name LIKE ?
          OR (u.first_name || ' ' || u.last_name) LIKE ?
       ORDER BY u.last_name, u.first_name
       LIMIT 50`
    )
    .all(like, like, like);
  res.json({
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      phone: r.phone,
      role: r.role,
      createdAt: r.created_at,
      membership: r.subscription_end
        ? {
            planName: r.plan_name,
            subscriptionEnd: r.subscription_end,
            trainingsRemaining: r.trainings_remaining,
          }
        : null,
    })),
  });
});

app.patch("/api/admin/users/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: "Некорректный id" });
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });

  const { subscriptionEnd, trainingsRemaining, planName } = req.body || {};
  const updates = [];
  const vals = [];

  if (subscriptionEnd !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(subscriptionEnd))) {
      return res.status(400).json({ error: "Дата окончания: формат ГГГГ-ММ-ДД" });
    }
    updates.push("subscription_end = ?");
    vals.push(subscriptionEnd);
  }
  if (trainingsRemaining !== undefined) {
    const n = parseInt(trainingsRemaining, 10);
    if (Number.isNaN(n) || n < 0) {
      return res.status(400).json({ error: "Остаток тренировок — целое число ≥ 0" });
    }
    updates.push("trainings_remaining = ?");
    vals.push(n);
  }
  if (planName !== undefined) {
    updates.push("plan_name = ?");
    vals.push(String(planName).trim() || null);
  }

  if (!updates.length) {
    return res.status(400).json({ error: "Нет полей для обновления" });
  }
  updates.push("updated_at = datetime('now')");

  const m = getMembership(id);
  if (!m) {
    const end = subscriptionEnd || new Date().toISOString().slice(0, 10);
    const tr = trainingsRemaining !== undefined ? parseInt(trainingsRemaining, 10) : 0;
    db.prepare(
      `INSERT INTO memberships (user_id, plan_name, subscription_end, trainings_remaining)
       VALUES (?, ?, ?, ?)`
    ).run(id, planName != null ? String(planName).trim() : "Абонемент", end, tr);
  } else {
    vals.push(id);
    db.prepare(`UPDATE memberships SET ${updates.join(", ")} WHERE user_id = ?`).run(...vals);
  }

  const u = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  const fresh = getMembership(id);
  res.json({ user: rowToUserPublic(u, fresh) });
});

app.get("/api/admin/trainers", requireAdmin, (req, res) => {
  const trainers = db.prepare("SELECT id, name, role, bio, created_at FROM trainers ORDER BY id DESC").all();
  res.json({ trainers });
});

app.post("/api/admin/trainers", requireAdmin, (req, res) => {
  const { name, role, bio } = req.body || {};
  const cleanName = String(name || "").trim();
  const cleanRole = String(role || "").trim();
  const cleanBio = String(bio || "").trim();
  if (!cleanName || !cleanRole || !cleanBio) {
    return res.status(400).json({ error: "Заполните имя, специализацию и описание" });
  }
  const info = db.prepare("INSERT INTO trainers (name, role, bio) VALUES (?, ?, ?)").run(cleanName, cleanRole, cleanBio);
  const trainer = db.prepare("SELECT id, name, role, bio, created_at FROM trainers WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ trainer });
});

app.delete("/api/admin/trainers/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: "Некорректный id тренера" });
  const exists = db.prepare("SELECT id FROM trainers WHERE id = ?").get(id);
  if (!exists) return res.status(404).json({ error: "Тренер не найден" });
  db.prepare("DELETE FROM trainers WHERE id = ?").run(id);
  res.json({ ok: true });
});

app.get("/api/zones", (req, res) => {
  res.json({ zones: getZonesPayload() });
});

app.get("/api/admin/zones/photos", requireAdmin, (req, res) => {
  res.json({ zones: getZonesPayload() });
});

app.post("/api/admin/zones/photos", requireAdmin, (req, res) => {
  const { zoneKey, caption, dataUrl } = req.body || {};
  const key = String(zoneKey || "").trim();
  if (!ZONE_DEFS[key]) {
    return res.status(400).json({ error: "Неизвестная зона" });
  }
  const cleanCaption = String(caption || "").trim();
  if (!cleanCaption) {
    return res.status(400).json({ error: "Подпись к фото обязательна" });
  }
  let fileName;
  try {
    fileName = saveImageFromDataUrl(
      dataUrl,
      path.join(__dirname, "public", "images", "zones-uploaded"),
      `${key}-${cleanCaption}`
    );
  } catch (e) {
    return res.status(400).json({ error: e.message || "Не удалось сохранить файл" });
  }
  const relativePath = `images/zones-uploaded/${fileName}`;
  const info = db
    .prepare("INSERT INTO zone_photos (zone_key, caption, image_path) VALUES (?, ?, ?)")
    .run(key, cleanCaption, relativePath);
  const photo = db
    .prepare("SELECT id, zone_key, caption, image_path FROM zone_photos WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json({
    photo: {
      id: photo.id,
      zoneKey: photo.zone_key,
      caption: photo.caption,
      src: photo.image_path,
    },
    zones: getZonesPayload(),
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Не найдено" });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`PRO GYM: http://localhost:${PORT}`);
  console.log("Админ по умолчанию: admin@progym.local / Admin123! (смените пароль в продакшене)");
});
