/* Anatomia — учебное приложение. Данные: words.js (ANATOMY_WORDS, CATEGORIES) */

const app = document.getElementById("app");
const tabs = document.querySelectorAll(".tab");

// ---- Состояние ----
const state = {
  view: "home",       // home | cards | quiz | write | list
  cat: "all",         // ключ раздела или "all"
  dir: "ru-la",       // ru-la | la-ru
};

// быстрый доступ к разделам
const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
const countByCat = CATEGORIES.map((c) => ({
  ...c,
  count: ANATOMY_WORDS.filter((w) => w.cat === c.key).length,
}));

// разделы, сгруппированные по полю group (для главной страницы)
function groupedCategories() {
  const groups = [];
  countByCat.forEach((c) => {
    const name = c.group || "Разделы";
    let g = groups.find((x) => x.name === name);
    if (!g) {
      g = { name, items: [], count: 0 };
      groups.push(g);
    }
    g.items.push(c);
    g.count += c.count;
  });
  return groups;
}

// ---- Утилиты ----
const shuffle = (a) => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const wordsForCat = (cat) =>
  cat === "all" ? ANATOMY_WORDS : ANATOMY_WORDS.filter((w) => w.cat === cat);
const catTitle = (cat) => (cat === "all" ? "Все разделы" : catMap[cat].title);
const esc = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ====================================================================
//  Рендер
// ====================================================================
function render() {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.go === state.view));
  if (state.view === "home") renderHome();
  else if (state.view === "cards") renderCards();
  else if (state.view === "quiz") renderQuiz();
  else if (state.view === "write") renderWrite();
  else if (state.view === "list") renderList();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("footStats").textContent =
  `${ANATOMY_WORDS.length} терминов · ${CATEGORIES.length} разделов`;

// ---- Главная ----
function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <div>
        <h1>Анатомия без зубрёжки.<br><span class="accent">Русский ↔ латынь</span></h1>
        <p>Учите анатомические термины через карточки и тесты. ${ANATOMY_WORDS.length} терминов,
           разбитых по системам организма — от костей до сосудов.</p>
        <div class="hero-cta">
          <button class="btn btn-primary" data-go="cards">Начать с карточек</button>
          <button class="btn btn-ghost" data-go="quiz">Пройти тест</button>
        </div>
        <div class="stat-row">
          <div class="stat"><b>${ANATOMY_WORDS.length}</b><span>терминов</span></div>
          <div class="stat"><b>${CATEGORIES.length}</b><span>разделов</span></div>
          <div class="stat"><b>2</b><span>направления</span></div>
        </div>
      </div>
      <div class="hero-img">
        <img src="assets/img/doctor.png" alt="Студентка-медик изучает анатомию" />
      </div>
    </section>

    ${groupedCategories()
      .map(
        (g) => `
      <div class="section-head">
        <h2>${g.name}</h2>
        <p>${g.count} терминов · выберите тему — и сразу учите карточки</p>
      </div>
      <div class="cat-grid">
        ${g.items
          .map(
            (c) => `
          <button class="cat-card" data-cat="${c.key}">
            <span class="cat-emoji c-${c.key}">${c.icon}</span>
            <span>
              <b>${c.title}</b><br>
              <small>${c.count} терминов</small>
            </span>
          </button>`
          )
          .join("")}
      </div>`
      )
      .join("")}`;

  app.querySelectorAll(".cat-card").forEach((el) =>
    el.addEventListener("click", () => {
      state.cat = el.dataset.cat;
      state.view = "cards";
      render();
    })
  );
}

// ---- Общая панель управления (раздел + направление) ----
function controlsHTML() {
  const catChips = [{ key: "all", title: "Все" }, ...CATEGORIES]
    .map(
      (c) =>
        `<button class="chip ${state.cat === c.key ? "active" : ""}" data-cat="${c.key}">${
          c.key === "all" ? "Все" : c.icon + " " + c.title
        }</button>`
    )
    .join("");
  const dirChips = [
    ["ru-la", "RU → LA"],
    ["la-ru", "LA → RU"],
  ]
    .map(
      ([k, label]) =>
        `<button class="chip ${state.dir === k ? "active" : ""}" data-dir="${k}">${label}</button>`
    )
    .join("");
  return `
    <div class="controls">
      <div class="control-group">
        <span class="control-label">Раздел</span>
        <div class="chips" id="catChips">${catChips}</div>
      </div>
      <div class="control-group">
        <span class="control-label">Направление</span>
        <div class="chips" id="dirChips">${dirChips}</div>
      </div>
    </div>`;
}

function bindControls(onChange) {
  app.querySelectorAll("#catChips .chip").forEach((el) =>
    el.addEventListener("click", () => {
      state.cat = el.dataset.cat;
      onChange();
    })
  );
  app.querySelectorAll("#dirChips .chip").forEach((el) =>
    el.addEventListener("click", () => {
      state.dir = el.dataset.dir;
      onChange();
    })
  );
}

function frontBack(w) {
  return state.dir === "ru-la"
    ? { front: w.ru, back: w.la, frontLang: "Русский", backLang: "Latina" }
    : { front: w.la, back: w.ru, frontLang: "Latina", backLang: "Русский" };
}

// ---- Карточки ----
let cardDeck = [];
let cardIndex = 0;

function renderCards() {
  cardDeck = shuffle(wordsForCat(state.cat));
  cardIndex = 0;
  app.innerHTML = controlsHTML() + `<div id="cardArea"></div>`;
  bindControls(renderCards);
  drawCard();
}

function drawCard() {
  const area = document.getElementById("cardArea");
  if (!cardDeck.length) {
    area.innerHTML = `<div class="row-empty">Нет терминов в этом разделе</div>`;
    return;
  }
  const w = cardDeck[cardIndex];
  const f = frontBack(w);
  area.innerHTML = `
    <div class="flash-wrap">
      <div class="flash-progress">${catTitle(state.cat)} · ${cardIndex + 1} / ${cardDeck.length}</div>
      <div class="flashcard" id="flashcard">
        <div class="flash-inner">
          <div class="flash-face flash-front">
            <span class="flash-lang">${f.frontLang}</span>
            <span class="flash-term">${esc(f.front)}</span>
            <span class="flash-hint">нажмите, чтобы перевернуть</span>
          </div>
          <div class="flash-face flash-back">
            <span class="flash-lang">${f.backLang}</span>
            <span class="flash-term">${esc(f.back)}</span>
            <span class="flash-hint">№ ${w.id}</span>
          </div>
        </div>
      </div>
      <div class="flash-controls">
        <button class="icon-btn" id="prevCard" title="Назад">←</button>
        <button class="icon-btn" id="shuffleCard" title="Перемешать">⟳</button>
        <button class="icon-btn" id="nextCard" title="Вперёд">→</button>
      </div>
    </div>`;

  const card = document.getElementById("flashcard");
  card.addEventListener("click", () => card.classList.toggle("flipped"));
  document.getElementById("prevCard").addEventListener("click", () => {
    cardIndex = (cardIndex - 1 + cardDeck.length) % cardDeck.length;
    drawCard();
  });
  document.getElementById("nextCard").addEventListener("click", () => {
    cardIndex = (cardIndex + 1) % cardDeck.length;
    drawCard();
  });
  document.getElementById("shuffleCard").addEventListener("click", () => {
    cardDeck = shuffle(cardDeck);
    cardIndex = 0;
    drawCard();
  });
}

// ---- Тест ----
const QUIZ_LEN = 10;
let quizPool = [];
let quizOrder = [];
let quizPos = 0;
let quizScore = 0;

function renderQuiz() {
  quizPool = wordsForCat(state.cat);
  app.innerHTML = controlsHTML() + `<div id="quizArea"></div>`;
  bindControls(renderQuiz);

  if (quizPool.length < 4) {
    document.getElementById("quizArea").innerHTML =
      `<div class="row-empty">Для теста нужно минимум 4 термина в разделе</div>`;
    return;
  }
  quizOrder = shuffle(quizPool).slice(0, Math.min(QUIZ_LEN, quizPool.length));
  quizPos = 0;
  quizScore = 0;
  drawQuestion();
}

function drawQuestion() {
  const area = document.getElementById("quizArea");
  if (quizPos >= quizOrder.length) return drawQuizResult();

  const w = quizOrder[quizPos];
  const f = frontBack(w);
  // 3 неверных варианта из того же пула
  const distractors = shuffle(quizPool.filter((x) => x.id !== w.id)).slice(0, 3);
  const options = shuffle([w, ...distractors]);
  const answerOf = (x) => (state.dir === "ru-la" ? x.la : x.ru);

  area.innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-top">
        <span>${catTitle(state.cat)}</span>
        <span>Вопрос ${quizPos + 1} / ${quizOrder.length} · Очки: ${quizScore}</span>
      </div>
      <div class="quiz-bar"><i style="width:${(quizPos / quizOrder.length) * 100}%"></i></div>
      <div class="quiz-question">
        <div class="q-lang">${f.frontLang} — выберите перевод</div>
        <div class="q-term">${esc(f.front)}</div>
      </div>
      <div class="quiz-options">
        ${options
          .map((o) => `<button class="quiz-opt" data-id="${o.id}">${esc(answerOf(o))}</button>`)
          .join("")}
      </div>
    </div>`;

  area.querySelectorAll(".quiz-opt").forEach((btn) =>
    btn.addEventListener("click", () => {
      const chosen = parseInt(btn.dataset.id, 10);
      const opts = area.querySelectorAll(".quiz-opt");
      opts.forEach((b) => {
        b.disabled = true;
        const id = parseInt(b.dataset.id, 10);
        if (id === w.id) b.classList.add("correct");
        else if (id === chosen) b.classList.add("wrong");
      });
      if (chosen === w.id) quizScore++;
      setTimeout(() => {
        quizPos++;
        drawQuestion();
      }, 850);
    })
  );
}

function drawQuizResult() {
  const total = quizOrder.length;
  const pct = Math.round((quizScore / total) * 100);
  const msg =
    pct === 100 ? "Идеально! 🎉" : pct >= 70 ? "Отличный результат 👍" : pct >= 40 ? "Неплохо, но повторите 📖" : "Стоит потренироваться 💪";
  document.getElementById("quizArea").innerHTML = `
    <div class="result">
      <div class="big">${quizScore} / ${total}</div>
      <p>${msg} · ${pct}% правильных</p>
      <div class="hero-cta" style="justify-content:center;margin-top:18px">
        <button class="btn btn-primary" id="quizAgain">Ещё раз</button>
        <button class="btn btn-ghost" data-go="home">На главную</button>
      </div>
    </div>`;
  document.getElementById("quizAgain").addEventListener("click", renderQuiz);
}

// ---- Написание (ввод термина) ----
let writeOrder = [];
let writePos = 0;
let writeResults = [];
let writePrev = null;

// посимвольное сравнение ответа с эталоном
function colorCompare(user, correct) {
  let html = "";
  const len = Math.max(user.length, correct.length);
  for (let i = 0; i < len; i++) {
    const u = user[i] || "";
    const c = correct[i] || "";
    if (u && u.toLowerCase() === c.toLowerCase())
      html += `<span class="char-ok">${esc(u)}</span>`;
    else html += `<span class="char-bad">${esc(u || "·")}</span>`;
  }
  return html || "<span class=\"char-bad\">(пусто)</span>";
}

function renderWrite() {
  const pool = wordsForCat(state.cat);
  app.innerHTML = controlsHTML() + `<div id="writeArea"></div>`;
  bindControls(renderWrite);

  if (!pool.length) {
    document.getElementById("writeArea").innerHTML =
      `<div class="row-empty">Нет терминов в этом разделе</div>`;
    return;
  }
  writeOrder = shuffle(pool);
  writePos = 0;
  writeResults = [];
  writePrev = null;
  drawWrite();
}

function drawWrite() {
  const area = document.getElementById("writeArea");
  if (writePos >= writeOrder.length) return drawWriteResult();

  const w = writeOrder[writePos];
  const f = frontBack(w);
  const total = writeOrder.length;

  const prevHTML = writePrev
    ? `<div class="write-prev ${writePrev.ok ? "ok" : "bad"}">
         <div class="wp-line"><b>Было:</b> ${esc(writePrev.front)}</div>
         <div class="wp-line"><b>Ваш ответ:</b> ${colorCompare(writePrev.user, writePrev.answer)}</div>
         <div class="wp-line"><b>Верно:</b> <span class="char-ok">${esc(writePrev.answer)}</span></div>
       </div>`
    : "";

  area.innerHTML = `
    <div class="write-wrap">
      <div class="quiz-top">
        <span>${catTitle(state.cat)}</span>
        <span>Вопрос ${writePos + 1} / ${total} · Верно: ${writeResults.filter((r) => r.ok).length}</span>
      </div>
      <div class="quiz-bar"><i style="width:${(writePos / total) * 100}%"></i></div>
      <div class="quiz-question">
        <div class="q-lang">${f.frontLang} — напишите перевод на ${f.backLang}</div>
        <div class="q-term">${esc(f.front)}</div>
      </div>
      <input class="write-input" id="writeInput" type="text"
             placeholder="Введите термин…" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <div class="write-actions">
        <button class="btn btn-primary" id="writeSubmit">Ответить</button>
        <button class="btn btn-ghost" data-go="home">Выйти</button>
      </div>
      ${prevHTML}
    </div>`;

  const input = document.getElementById("writeInput");
  input.focus();
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitWrite();
  });
  document.getElementById("writeSubmit").addEventListener("click", submitWrite);
}

function submitWrite() {
  const w = writeOrder[writePos];
  const f = frontBack(w);
  const user = document.getElementById("writeInput").value.trim();
  const ok = user.toLowerCase() === f.back.toLowerCase();

  writePrev = { front: f.front, answer: f.back, user, ok };
  writeResults.push({ word: w, front: f.front, answer: f.back, user, ok });
  writePos++;
  drawWrite();
}

function drawWriteResult() {
  const total = writeResults.length;
  const correct = writeResults.filter((r) => r.ok).length;
  const pct = Math.round((correct / total) * 100);
  const msg =
    pct === 100 ? "Идеально! 🎉" : pct >= 70 ? "Отличный результат 👍" : pct >= 40 ? "Неплохо, но повторите 📖" : "Стоит потренироваться 💪";

  const rows = writeResults
    .map(
      (r) => `
      <div class="write-row ${r.ok ? "ok" : "bad"}">
        <span class="wr-mark">${r.ok ? "✓" : "✘"}</span>
        <div>
          <div class="wr-front">${esc(r.front)}</div>
          <div class="wr-answer"><b>Верно:</b> ${esc(r.answer)}</div>
          ${r.ok ? "" : `<div class="wr-user">Ваш ответ: ${colorCompare(r.user, r.answer)}</div>`}
        </div>
      </div>`
    )
    .join("");

  const wrong = writeResults.filter((r) => !r.ok).length;
  document.getElementById("writeArea").innerHTML = `
    <div class="write-wrap">
      <div class="result">
        <div class="big">${correct} / ${total}</div>
        <p>${msg} · ${pct}% правильных</p>
        <div class="hero-cta" style="justify-content:center;margin-top:18px">
          ${wrong ? `<button class="btn btn-primary" id="writeRepeat">Повторить ошибки (${wrong})</button>` : ""}
          <button class="btn ${wrong ? "btn-ghost" : "btn-primary"}" id="writeAgain">Ещё раз</button>
          <button class="btn btn-ghost" data-go="home">На главную</button>
        </div>
      </div>
      <div class="write-list">${rows}</div>
    </div>`;

  document.getElementById("writeAgain").addEventListener("click", renderWrite);
  if (wrong) {
    document.getElementById("writeRepeat").addEventListener("click", () => {
      writeOrder = shuffle(writeResults.filter((r) => !r.ok).map((r) => r.word));
      writePos = 0;
      writeResults = [];
      writePrev = null;
      drawWrite();
    });
  }
}

// ---- Список / поиск ----
let listQuery = "";

function renderList() {
  app.innerHTML =
    controlsHTMLNoDir() +
    `<input class="search" id="search" type="text" placeholder="Поиск по русскому или латыни…" value="${esc(listQuery)}" />
     <div class="table" id="tableArea"></div>`;

  app.querySelectorAll("#catChips .chip").forEach((el) =>
    el.addEventListener("click", () => {
      state.cat = el.dataset.cat;
      renderList();
    })
  );
  const input = document.getElementById("search");
  input.addEventListener("input", () => {
    listQuery = input.value;
    drawTable();
  });
  drawTable();
  input.focus();
  input.setSelectionRange(listQuery.length, listQuery.length);
}

// панель только с разделами (для списка направление не нужно)
function controlsHTMLNoDir() {
  const catChips = [{ key: "all", title: "Все" }, ...CATEGORIES]
    .map(
      (c) =>
        `<button class="chip ${state.cat === c.key ? "active" : ""}" data-cat="${c.key}">${
          c.key === "all" ? "Все" : c.icon + " " + c.title
        }</button>`
    )
    .join("");
  return `
    <div class="controls">
      <div class="control-group">
        <span class="control-label">Раздел</span>
        <div class="chips" id="catChips">${catChips}</div>
      </div>
    </div>`;
}

function drawTable() {
  const q = listQuery.trim().toLowerCase();
  let rows = wordsForCat(state.cat);
  if (q) rows = rows.filter((w) => w.ru.toLowerCase().includes(q) || w.la.toLowerCase().includes(q));

  const area = document.getElementById("tableArea");
  if (!rows.length) {
    area.innerHTML = `<div class="row-empty">Ничего не найдено</div>`;
    return;
  }
  area.innerHTML = rows
    .map(
      (w) => `
      <div class="row">
        <span class="num">${w.id}</span>
        <span class="ru">${esc(w.ru)}</span>
        <span class="la">${esc(w.la)}</span>
      </div>`
    )
    .join("");
}

// ====================================================================
//  Навигация
// ====================================================================
const burger = document.getElementById("burger");
const tabsNav = document.getElementById("tabs");

function setMenu(open) {
  tabsNav.classList.toggle("open", open);
  burger.classList.toggle("active", open);
  burger.setAttribute("aria-expanded", String(open));
}

burger.addEventListener("click", () => setMenu(!tabsNav.classList.contains("open")));

document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) {
    state.view = go.dataset.go;
    setMenu(false); // закрыть мобильное меню при переходе
    render();
    return;
  }
  // клик вне меню и вне бургера — закрываем
  if (tabsNav.classList.contains("open") && !e.target.closest("#tabs, #burger")) {
    setMenu(false);
  }
});

render();
