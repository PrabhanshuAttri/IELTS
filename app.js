(function () {
  "use strict";

  const PROGRESS_KEY = "ielts_progress_v1";
  const TOPICS_KEY = "ielts_selected_topics_v1";
  const MAX_BOX = 5;

  const topics = [...new Set(VOCAB.map((w) => w.topic))];

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

  function loadSelectedTopics() {
    try {
      const stored = JSON.parse(localStorage.getItem(TOPICS_KEY));
      if (Array.isArray(stored) && stored.length) return stored;
    } catch (e) {}
    return [...topics];
  }
  function saveSelectedTopics(list) {
    localStorage.setItem(TOPICS_KEY, JSON.stringify(list));
  }

  let selectedTopics = new Set(loadSelectedTopics());

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

  // ---------- deck picker ----------
  const topicListEl = $("#topic-list");
  const deckCountEl = $("#deck-count");

  function renderTopicList() {
    topicListEl.innerHTML = "";
    topics.forEach((topic) => {
      const count = VOCAB.filter((w) => w.topic === topic).length;
      const item = el("label", "topic-item" + (selectedTopics.has(topic) ? " checked" : ""));
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = selectedTopics.has(topic);
      input.addEventListener("change", () => {
        if (input.checked) selectedTopics.add(topic);
        else selectedTopics.delete(topic);
        saveSelectedTopics([...selectedTopics]);
        renderTopicList();
      });
      item.appendChild(input);
      item.appendChild(el("span", "topic-name", topic));
      item.appendChild(el("span", "topic-count", String(count)));
      topicListEl.appendChild(item);
    });
    const total = VOCAB.filter((w) => selectedTopics.has(w.topic)).length;
    deckCountEl.textContent = `${total} word${total === 1 ? "" : "s"} selected`;
    $("#start-session").disabled = total === 0;
  }

  $("#select-all-topics").addEventListener("click", () => {
    selectedTopics = new Set(topics);
    saveSelectedTopics([...selectedTopics]);
    renderTopicList();
  });
  $("#select-none-topics").addEventListener("click", () => {
    selectedTopics = new Set();
    saveSelectedTopics([...selectedTopics]);
    renderTopicList();
  });

  function currentDeck() {
    return VOCAB.filter((w) => selectedTopics.has(w.topic));
  }

  // ---------- view switching ----------
  const views = {
    picker: $("#deck-picker"),
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
      } else {
        mode = target;
        showView("picker");
        renderTopicList();
      }
    });
  });

  $("#start-session").addEventListener("click", () => {
    if (mode === "flashcards") startFlashcards();
    else startMcq();
  });
  $("#fc-restart").addEventListener("click", () => { showView("picker"); renderTopicList(); });
  $("#mcq-restart").addEventListener("click", () => { showView("picker"); renderTopicList(); });
  $("#session-again").addEventListener("click", () => { showView("picker"); renderTopicList(); });

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
    $("#fc-pos").textContent = w.pos;
    $("#fc-word").textContent = w.word;
    $("#fc-def").textContent = w.definition;
    $("#fc-example").textContent = w.example.replace("___", w.word);
    $("#fc-syn").textContent = "Synonyms: " + w.synonyms.join(", ");
    $("#fc-progress").textContent = `Card ${fcIndex + 1} of ${fcQueue.length}`;
  }

  $("#flashcard").addEventListener("click", () => {
    $("#flashcard").classList.toggle("flipped");
  });
  $("#flashcard").addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); $("#flashcard").classList.toggle("flipped"); }
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
      row.appendChild(el("div", "name", topic));
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.width = `${(masteredCount / words.length) * 100}%`;
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "frac", `${masteredCount}/${words.length}`));
      topicsEl.appendChild(row);
    });
  }

  $("#reset-progress").addEventListener("click", () => {
    if (confirm("This will erase all saved flashcard/MCQ progress on this device. Continue?")) {
      localStorage.removeItem(PROGRESS_KEY);
      renderStats();
    }
  });

  // ---------- init ----------
  renderTopicList();
  showView("picker");
})();
