// Собирает assets/js/words.js и data/words.json из базовой анатомии
// (существующие записи data/words.json, id 1..725) + нейроанатомии (src/neuro.js).
// Идемпотентно: нейро-записи каждый раз пересобираются заново.
// Запуск из корня проекта: node src/build.js
const fs = require("fs");
const path = require("path");
const { neuroCategories, neuroTerms } = require("./neuro");

const ROOT = path.join(__dirname, "..");

// Базовые разделы общей анатомии (совпадают с исходным src/parse.js)
const BASE_CATEGORIES = [
  { key: "bones",       title: "Кости",                  icon: "🦴", group: "Общая анатомия" },
  { key: "joints",      title: "Суставы и связки",       icon: "🔗", group: "Общая анатомия" },
  { key: "muscles",     title: "Мышцы",                  icon: "💪", group: "Общая анатомия" },
  { key: "digestive",   title: "Пищеварительная система", icon: "🍽️", group: "Общая анатомия" },
  { key: "respiratory", title: "Дыхательная система",    icon: "🫁", group: "Общая анатомия" },
  { key: "urogenital",  title: "Мочеполовая система",    icon: "🩺", group: "Общая анатомия" },
  { key: "heart",       title: "Сердце",                 icon: "❤️", group: "Общая анатомия" },
  { key: "arteries",    title: "Артерии",                icon: "🩸", group: "Общая анатомия" },
  { key: "veins",       title: "Вены",                   icon: "💧", group: "Общая анатомия" },
];
const baseKeys = new Set(BASE_CATEGORIES.map((c) => c.key));

// Базовые слова: берём из data/words.json, оставляем только общую анатомию
const existing = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "words.json"), "utf8"));
const baseWords = existing
  .filter((w) => baseKeys.has(w.cat))
  .map(({ id, ru, la, cat }) => ({ id, ru, la, cat }));

let nextId = Math.max(...baseWords.map((w) => w.id)) + 1;

// Нейро-слова: дедуп по ru внутри одной темы, новые последовательные id
const neuroWords = [];
for (const cat of neuroCategories) {
  const seen = new Set();
  for (const t of neuroTerms[cat.key]) {
    const key = t.ru.replace(/\s+/g, " ").trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    neuroWords.push({ id: nextId++, ru: t.ru.trim(), la: t.la.trim(), cat: cat.key });
  }
}

const words = [...baseWords, ...neuroWords];
const categories = [
  ...BASE_CATEGORIES,
  ...neuroCategories.map((c) => ({ ...c, group: "Нейроанатомия" })),
];

fs.writeFileSync(
  path.join(ROOT, "data", "words.json"),
  JSON.stringify(words, null, 2),
  "utf8"
);

const catsForApp = categories.map(({ key, title, icon, group }) => ({ key, title, icon, group }));
const js =
  "// Автогенерируется src/build.js — не редактировать вручную\n" +
  "const CATEGORIES = " + JSON.stringify(catsForApp, null, 2) + ";\n" +
  "const ANATOMY_WORDS = " + JSON.stringify(words) + ";\n";
fs.writeFileSync(path.join(ROOT, "assets", "js", "words.js"), js, "utf8");

const counts = {};
for (const w of words) counts[w.cat] = (counts[w.cat] || 0) + 1;
console.log("Готово. Всего терминов: " + words.length + " (нейро: " + neuroWords.length + ")");
console.log(counts);
