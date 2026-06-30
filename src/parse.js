// Парсер файла src/doc -> data/words.json + assets/js/words.js
// Структура записи: { id, ru, la, cat }
// Запуск из корня проекта: node src/parse.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const raw = fs.readFileSync(path.join(__dirname, "doc"), "utf8");
const lines = raw.split(/\r?\n/);

// Разделы по диапазонам id (классическая систематика анатомии)
const CATEGORIES = [
  { key: "bones",       title: "Кости",                 icon: "🦴", from: 1,   to: 200 },
  { key: "joints",      title: "Суставы и связки",      icon: "🔗", from: 201, to: 242 },
  { key: "muscles",     title: "Мышцы",                 icon: "💪", from: 243, to: 416 },
  { key: "digestive",   title: "Пищеварительная система", icon: "🍽️", from: 417, to: 480 },
  { key: "respiratory", title: "Дыхательная система",   icon: "🫁", from: 481, to: 522 },
  { key: "urogenital",  title: "Мочеполовая система",   icon: "🩺", from: 523, to: 589 },
  { key: "heart",       title: "Сердце",                icon: "❤️", from: 590, to: 626 },
  { key: "arteries",    title: "Артерии",               icon: "🩸", from: 627, to: 689 },
  { key: "veins",       title: "Вены",                  icon: "💧", from: 690, to: 725 },
];

function catFor(id) {
  const c = CATEGORIES.find((c) => id >= c.from && id <= c.to);
  return c ? c.key : "other";
}

// Сборка записей: строка может продолжаться на следующей (латынь перенесена)
const entries = [];
let current = null;

for (const line of lines) {
  const m = line.match(/^\s*(\d+)\.\s*(.*)$/);
  if (m) {
    if (current) entries.push(current);
    current = { id: parseInt(m[1], 10), text: m[2] };
  } else if (current && line.trim() !== "") {
    // продолжение латинской части на новой строке
    current.text += " " + line.trim();
  }
}
if (current) entries.push(current);

const words = [];
for (const e of entries) {
  // разделитель — длинное тире – или — (внутри слов используется обычный дефис)
  const idx = e.text.search(/[–—]/);
  if (idx === -1) {
    console.warn("Нет разделителя у #" + e.id + ": " + e.text);
    continue;
  }
  const ru = e.text.slice(0, idx).replace(/\s+/g, " ").trim();
  const la = e.text.slice(idx + 1).replace(/\s+/g, " ").trim();
  if (!ru || !la) {
    console.warn("Пустая часть у #" + e.id);
    continue;
  }
  words.push({ id: e.id, ru, la, cat: catFor(e.id) });
}

words.sort((a, b) => a.id - b.id);

fs.writeFileSync(
  path.join(ROOT, "data", "words.json"),
  JSON.stringify(words, null, 2),
  "utf8"
);

// words.js — чтобы приложение работало при открытии index.html напрямую (file://)
const catsForApp = CATEGORIES.map(({ key, title, icon }) => ({ key, title, icon }));
const js =
  "// Автогенерируется src/parse.js — не редактировать вручную\n" +
  "const CATEGORIES = " + JSON.stringify(catsForApp, null, 2) + ";\n" +
  "const ANATOMY_WORDS = " + JSON.stringify(words) + ";\n";
fs.writeFileSync(path.join(ROOT, "assets", "js", "words.js"), js, "utf8");

console.log("Готово. Терминов: " + words.length);
const counts = {};
for (const w of words) counts[w.cat] = (counts[w.cat] || 0) + 1;
console.log(counts);
