# IELTS Academic Prep — Vocabulary & MCQ Trainer

A self-contained, offline-friendly study app for IELTS Academic prep: flashcards with Leitner-style spaced repetition, fill-in-the-blank MCQ practice, a searchable browse-all view, a progress tracker, Reading and Writing practice sets with sample questions, and a study guide with exam format notes and Band 8–9 preparation tips. Everything lives on a single page (`index.html`) with tabs to switch views, so theme and progress stay consistent everywhere. Progress is saved locally in your browser (`localStorage`) — nothing is sent anywhere, so it works entirely offline and stays private to your device/browser. No build step, no dependencies — plain HTML/CSS/JS.

## Running it

Just open `index.html` in a browser, or serve the folder with any static server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. On GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, branch `main`, folder `/ (root)`.
3. Your site will be published at `https://<your-username>.github.io/<repo-name>/`.
