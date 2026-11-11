# Encoding strategies experiment — revised version

PSYC 402 browser experiment using separate static `index.html`, `styles.css`, and `script.js`. Works without a build step, database, third-party libraries, or an internet connection.

## Experiment
- **Three strategies:** maintenance rehearsal, self-reference, and mental imagery, with strategy order randomized for each session.
- **Three different word lists:** six everyday concrete words in each; list-to-strategy assignment is randomized each session (and word order is shuffled within each list).
- **Study:** each word appears for three seconds, with a strategy instruction before each block.
- **Distractor:** a timed 30-second backward-by-threes task starting from a random three-digit number.
- **Recall:** enter any of the 18 words in any order; scores ignore capitalization and conservatively accept obvious small spelling errors.
- **Exports:** one-row session summary CSV and 18-row trial-level CSV, generated locally in the browser.

## Revision made after testing
**Added an accessible, proportional three-bar results chart** so participants can compare recall scores across encoding strategies at a glance without removing the original numeric scores or affecting the experiment and downloads.

## Publish as two commits (for the assignment)
1. Create a new public GitHub repository named `encoding-demo`.
2. Upload the four files from **encoding-demo-initial.zip**, then commit with the message `Initial working memory experiment`.
3. Open **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)**, and save.
4. Visit the GitHub Pages URL and finish an online session, checking both CSV downloads.
5. Replace `script.js`, `styles.css` and `README.md` with the corresponding files from **encoding-demo-final.zip**, then commit with the message `Add visual comparison of encoding strategy recall`.
6. Refresh the GitHub Pages URL and verify that the chart appears and both CSVs still download.

Expected submission URLs (replace `YOUR-USERNAME` with your actual GitHub username):
- Site: `https://YOUR-USERNAME.github.io/encoding-demo/`
- Repository: `https://github.com/YOUR-USERNAME/encoding-demo`

## Privacy
The experiment collects no identifying information and does not send responses anywhere. Do not commit participant data to the repository.

## Note on scoring
Automated typo matching is deliberately conservative; it is a practical heuristic, not full semantic interpretation. Keep the same word lists and rules for participants you intend to compare.
