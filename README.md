# IELTS Academic Prep — Vocabulary & MCQ Trainer

A self-contained, offline-friendly study app for IELTS Academic vocabulary, built around two practice modes:

- **Flashcards** — word → definition/example/synonyms, with a simple Leitner-style spaced-repetition tracker.
- **Fill-in-the-blank MCQ** — a real IELTS-style question format (used throughout Listening and Reading), generated from the same word bank.

Progress is saved locally in your browser (`localStorage`) — nothing is sent anywhere, so it works entirely offline and stays private to your device/browser.

## Quick start

Just open `index.html` in a browser, or serve the folder with any static server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository (see commands below).
2. On GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, branch `main`, folder `/ (root)`.
3. Your site will be published at `https://<your-username>.github.io/<repo-name>/`.

```bash
git init
git add .
git commit -m "Initial IELTS vocabulary trainer"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## How the content was chosen

The word bank (`data/vocab.js`) targets **IELTS Academic, Band 8–9**: ~120 low-frequency academic/topic-specific words across the 12 topics IELTS reading, listening, and writing passages draw on most heavily (environment, education, technology, health, economy, urbanization, government, crime & justice, media, culture, science, and work). Each entry includes part of speech, a precise definition, a natural example sentence, and near-synonyms — the kind of nuance-testing vocabulary that separates Band 7 from Band 8–9 (precise word choice, collocation awareness, less common academic register).

MCQ distractors are generated **on the fly** from other words in the same topic/part of speech, so the wrong options are always plausible, topic-relevant near-misses rather than random noise — closer to how real IELTS distractors are designed.

To add or edit words, just edit the array in `data/vocab.js` — no build step required.

## IELTS Academic exam — quick reference

*(For your own verification closer to test day, always cross-check against the official [ielts.org](https://www.ielts.org) test format page, since minor format details are occasionally updated.)*

| Section | Time | Content |
|---|---|---|
| **Listening** | 30 min (+ transfer time) | 40 questions, 4 recordings of increasing difficulty. Shared with General Training. |
| **Reading** | 60 min | 40 questions, 3 long academic passages (journal/textbook/magazine style). Question types include multiple choice, matching headings/information, sentence completion, and **fill-in-the-blank** (summary/note/table completion). |
| **Writing** | 60 min | Task 1 (20 min, ~150 words): describe a chart/graph/table/diagram. Task 2 (40 min, ~250 words): argumentative/discursive essay. Task 2 counts twice as much as Task 1 toward the Writing band. |
| **Speaking** | 11–14 min | 3 parts: introduction/interview, a 2-minute long-turn on a cue card, and a two-way discussion on related themes. Shared with General Training. |

Total time: **≈2 hours 45 minutes**. Bands are scored 1–9 in 0.5 increments per section, then averaged (rounded) for the Overall Band Score. Many centres now also offer the **One Skill Retake (OSR)**, letting you re-sit a single section instead of the full test if only one score falls short.

### Why vocabulary breadth matters for the band descriptors

- **Reading & Listening**: many questions (sentence/summary/table completion, matching) hinge on recognising a *paraphrase* of a word in the passage — the exact word you're tested on rarely appears verbatim in the question. This is exactly why the flashcards emphasize synonyms, not just single-word definitions.
- **Writing**: the Band 8–9 "Lexical Resource" criterion explicitly rewards a "wide range of vocabulary… used with natural and sophisticated control," including less common/idiomatic items with only occasional inaccuracies.
- **Speaking**: the "Lexical Resource" criterion at Band 8–9 similarly requires flexible, precise vocabulary including idiomatic language, used naturally.

### Suggested study rhythm

1. **Daily flashcard pass** on 2–3 topics (10–15 min) — prioritize topics with the lowest "mastered" percentage on the Progress tab.
2. **MCQ pass** on the same topics right after, to force active recall in a sentence context (closer to actual Reading/Listening tasks).
3. Once a topic reaches ~80%+ mastered, fold it into a mixed "all topics" review session weekly to fight forgetting.
4. Actively reuse 3–5 new words per week in your own Writing Task 2 practice essays and Speaking part-2 answers — passive recognition (flashcards) and active production (writing/speaking) are different skills and both need practice.

## Project structure

```
index.html        Markup / views (deck picker, flashcards, MCQ, progress)
style.css         Styling (light/dark theme aware)
app.js            App logic: deck selection, Leitner progress, MCQ generation
data/vocab.js     The vocabulary bank — edit/extend this to add more words or topics
```
