(function () {
  "use strict";

  const PROGRESS_KEY = "ielts_progress_v1";
  const THEME_KEY = "ielts_theme";
  const MAX_BOX = 5;

  // ---------- theme toggle ----------
  function effectiveTheme() {
    const stored = (() => { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } })();
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function updateThemeButton() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const current = effectiveTheme();
    const isDark = current === "dark";
    btn.setAttribute("aria-pressed", String(isDark));
    btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  }
  const themeToggleBtn = document.getElementById("theme-toggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const next = effectiveTheme() === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      document.documentElement.setAttribute("data-theme", next);
      updateThemeButton();
    });
  }
  updateThemeButton();

  const topics = [...new Set(VOCAB.map((w) => w.topic))];

  // Category-tag accent, per DESIGN.md: only purple/orange/pink/blue are used
  // for tagging (green is reserved for the brand CTA), so the 12 topics cycle
  // through this fixed 4-color set rather than an arbitrary hue per topic.
  const topicAccent = {
    "Environment & Climate Change": "blue",
    "Education & Academia": "purple",
    "Technology & Innovation": "blue",
    "Health & Medicine": "pink",
    "Economy & Globalization": "orange",
    "Urbanization & Infrastructure": "pink",
    "Government & Policy": "purple",
    "Crime & Justice": "orange",
    "Media & Communication": "pink",
    "Culture & Society": "purple",
    "Science & Research": "blue",
    "Work & Employment": "orange",
  };

  // ---------- progress storage ----------
  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveProgress(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }
  function getEntry(progress, word) {
    return progress[word] || { box: 1, correct: 0, wrong: 0, seen: 0 };
  }
  function recordAnswer(word, wasCorrect) {
    const progress = loadProgress();
    const e = getEntry(progress, word);
    e.seen += 1;
    if (wasCorrect) {
      e.correct += 1;
      e.box = Math.min(MAX_BOX, e.box + 1);
    } else {
      e.wrong += 1;
      e.box = 1;
    }
    progress[word] = e;
    saveProgress(progress);
  }

  // ---------- utils ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function paintChip(chipEl, topic) {
    chipEl.textContent = topic;
    chipEl.classList.remove("accent-purple", "accent-orange", "accent-pink", "accent-blue");
    chipEl.classList.add("accent-" + topicAccent[topic]);
  }
  function paintDifficulty(badgeEl, difficulty) {
    badgeEl.textContent = difficulty;
    badgeEl.classList.toggle("band-9", difficulty === "Band 9");
  }

  function currentDeck() {
    return VOCAB;
  }

  // ---------- view switching ----------
  const views = {
    flashcards: $("#flashcard-view"),
    mcq: $("#mcq-view"),
    stats: $("#stats-view"),
    end: $("#session-end"),
  };
  function showView(name) {
    Object.values(views).forEach((v) => v.classList.add("hidden"));
    views[name].classList.remove("hidden");
  }

  let mode = "flashcards"; // 'flashcards' | 'mcq'

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const target = btn.dataset.mode;
      if (target === "stats") {
        renderStats();
        showView("stats");
      } else if (target === "flashcards") {
        mode = "flashcards";
        startFlashcards();
      } else if (target === "mcq") {
        mode = "mcq";
        startMcq();
      }
    });
  });

  $("#fc-restart").addEventListener("click", startFlashcards);
  $("#mcq-restart").addEventListener("click", startMcq);
  $("#session-again").addEventListener("click", () => {
    activateModeTab(mode);
    if (mode === "flashcards") startFlashcards(); else startMcq();
  });

  function activateModeTab(name) {
    document.querySelectorAll(".mode-btn").forEach((b) => {
      const isTarget = b.dataset.mode === name;
      b.classList.toggle("active", isTarget);
      b.setAttribute("aria-selected", String(isTarget));
    });
  }

  // ---------- flashcards ----------
  let fcQueue = [];
  let fcIndex = 0;
  let fcResults = { right: 0, wrong: 0 };

  function startFlashcards() {
    fcQueue = shuffle(currentDeck());
    fcIndex = 0;
    fcResults = { right: 0, wrong: 0 };
    showView("flashcards");
    renderFlashcard();
  }

  function renderFlashcard() {
    if (fcIndex >= fcQueue.length) {
      finishSession(`Flashcards: ${fcResults.right} known, ${fcResults.wrong} still learning, out of ${fcQueue.length}.`);
      return;
    }
    const w = fcQueue[fcIndex];
    const card = $("#flashcard");
    card.classList.remove("flipped");
    card.setAttribute("aria-pressed", "false");
    paintChip($("#fc-topic"), w.topic);
    paintDifficulty($("#fc-difficulty"), w.difficulty);
    $("#fc-pos").textContent = w.pos;
    $("#fc-word").textContent = w.word;
    $("#fc-def").textContent = w.definition;
    $("#fc-example").textContent = w.example.replace("___", w.word);
    const synEl = $("#fc-syn");
    synEl.innerHTML = "";
    w.synonyms.forEach((s) => synEl.appendChild(el("span", "fc-syn-pill", s)));
    $("#fc-progress").textContent = `Card ${fcIndex + 1} of ${fcQueue.length}`;
  }

  function toggleFlip() {
    const card = $("#flashcard");
    const flipped = card.classList.toggle("flipped");
    card.setAttribute("aria-pressed", String(flipped));
  }
  $("#flashcard").addEventListener("click", toggleFlip);
  $("#flashcard").addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); toggleFlip(); }
  });

  function answerFlashcard(knew) {
    const w = fcQueue[fcIndex];
    recordAnswer(w.word, knew);
    if (knew) fcResults.right++; else fcResults.wrong++;
    fcIndex++;
    renderFlashcard();
  }
  $("#fc-know").addEventListener("click", () => answerFlashcard(true));
  $("#fc-dont-know").addEventListener("click", () => answerFlashcard(false));

  // ---------- MCQ ----------
  let mcqQueue = [];
  let mcqIndex = 0;
  let mcqScore = { right: 0, wrong: 0 };
  let mcqAnswered = false;

  function startMcq() {
    mcqQueue = shuffle(currentDeck());
    mcqIndex = 0;
    mcqScore = { right: 0, wrong: 0 };
    showView("mcq");
    renderMcq();
  }

  function buildOptions(target) {
    const deck = currentDeck();
    let pool = deck.filter((w) => w.word !== target.word && w.topic === target.topic && w.pos === target.pos);
    if (pool.length < 3) {
      pool = pool.concat(deck.filter((w) => w.word !== target.word && w.topic === target.topic && !pool.includes(w)));
    }
    if (pool.length < 3) {
      pool = pool.concat(VOCAB.filter((w) => w.word !== target.word && w.pos === target.pos && !pool.includes(w) && w.word !== target.word));
    }
    if (pool.length < 3) {
      pool = pool.concat(VOCAB.filter((w) => w.word !== target.word && !pool.includes(w)));
    }
    const distractors = shuffle([...new Set(pool)]).slice(0, 3);
    return shuffle([target, ...distractors]);
  }

  function renderMcq() {
    if (mcqIndex >= mcqQueue.length) {
      finishSession(`MCQ: ${mcqScore.right} correct out of ${mcqQueue.length} (${Math.round((mcqScore.right / mcqQueue.length) * 100)}%).`);
      return;
    }
    mcqAnswered = false;
    const target = mcqQueue[mcqIndex];
    const options = buildOptions(target);
    paintChip($("#mcq-topic"), target.topic);
    paintDifficulty($("#mcq-difficulty"), target.difficulty);
    $("#mcq-progress").textContent = `Question ${mcqIndex + 1} of ${mcqQueue.length}`;
    $("#mcq-score").textContent = `Score: ${mcqScore.right}/${mcqIndex}`;

    const sentenceEl = $("#mcq-sentence");
    sentenceEl.innerHTML = "";
    const parts = target.example.split("___");
    sentenceEl.appendChild(document.createTextNode(parts[0]));
    sentenceEl.appendChild(el("span", "blank", "_____"));
    sentenceEl.appendChild(document.createTextNode(parts[1] || ""));

    const optionsEl = $("#mcq-options");
    optionsEl.innerHTML = "";
    const letters = ["A", "B", "C", "D"];
    options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "mcq-option";
      btn.innerHTML = `<span class="opt-key">${letters[i]}</span><span>${opt.word}</span>`;
      btn.addEventListener("click", () => selectMcqOption(target, opt, btn));
      optionsEl.appendChild(btn);
    });

    $("#mcq-feedback").classList.add("hidden");
    $("#mcq-next").classList.add("hidden");
  }

  function selectMcqOption(target, chosen, btnEl) {
    if (mcqAnswered) return;
    mcqAnswered = true;
    const isCorrect = chosen.word === target.word;
    recordAnswer(target.word, isCorrect);
    if (isCorrect) mcqScore.right++; else mcqScore.wrong++;

    document.querySelectorAll(".mcq-option").forEach((b) => {
      b.disabled = true;
      const label = b.querySelector("span:last-child").textContent;
      if (label === target.word) b.classList.add("correct");
      else if (b === btnEl) b.classList.add("incorrect");
    });

    const fb = $("#mcq-feedback");
    fb.classList.remove("hidden");
    fb.classList.toggle("mcq-feedback-correct", isCorrect);
    fb.classList.toggle("mcq-feedback-incorrect", !isCorrect);
    fb.textContent = (isCorrect ? "Correct — " : `Not quite. The answer was "${target.word}". `) +
      `${target.word} (${target.pos}): ${target.definition}`;

    $("#mcq-score").textContent = `Score: ${mcqScore.right}/${mcqIndex + 1}`;
    $("#mcq-next").classList.remove("hidden");
  }

  $("#mcq-next").addEventListener("click", () => {
    mcqIndex++;
    renderMcq();
  });

  function finishSession(summary) {
    $("#session-summary").textContent = summary;
    showView("end");
  }

  // ---------- stats ----------
  function renderStats() {
    const progress = loadProgress();
    let mastered = 0, learning = 0, untouched = 0;
    VOCAB.forEach((w) => {
      const e = progress[w.word];
      if (!e || e.seen === 0) untouched++;
      else if (e.box >= MAX_BOX) mastered++;
      else learning++;
    });

    const overall = $("#stats-overall");
    overall.innerHTML = "";
    [
      ["Mastered", mastered],
      ["In progress", learning],
      ["Not started", untouched],
      ["Total words", VOCAB.length],
    ].forEach(([label, num]) => {
      const box = el("div", "stat-box");
      box.appendChild(el("div", "num", String(num)));
      box.appendChild(el("div", "label", label));
      overall.appendChild(box);
    });

    const topicsEl = $("#stats-topics");
    topicsEl.innerHTML = "";
    topics.forEach((topic) => {
      const words = VOCAB.filter((w) => w.topic === topic);
      const masteredCount = words.filter((w) => progress[w.word] && progress[w.word].box >= MAX_BOX).length;
      const row = el("div", "stat-row");
      const nameChip = el("div", "name topic-chip");
      paintChip(nameChip, topic);
      row.appendChild(nameChip);
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.width = `${(masteredCount / words.length) * 100}%`;
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "frac", `${masteredCount}/${words.length}`));
      topicsEl.appendChild(row);
    });

    const difficultyEl = $("#stats-difficulty");
    difficultyEl.innerHTML = "";
    ["Band 8", "Band 9"].forEach((level) => {
      const words = VOCAB.filter((w) => w.difficulty === level);
      const masteredCount = words.filter((w) => progress[w.word] && progress[w.word].box >= MAX_BOX).length;
      const row = el("div", "stat-row");
      const badge = el("div", "name difficulty-badge" + (level === "Band 9" ? " band-9" : ""), level);
      row.appendChild(badge);
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.width = `${(masteredCount / words.length) * 100}%`;
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "frac", `${masteredCount}/${words.length}`));
      difficultyEl.appendChild(row);
    });
  }

  $("#reset-progress").addEventListener("click", () => {
    if (confirm("This will erase all saved flashcard/MCQ progress on this device. Continue?")) {
      localStorage.removeItem(PROGRESS_KEY);
      renderStats();
    }
  });

  // ---------- init ----------
  startFlashcards();
})();
