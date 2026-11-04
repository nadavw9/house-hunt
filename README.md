# house-hunt

Rental-house board for the Sharon / Emek Hefer search. Static page on GitHub Pages, shared statuses in Firebase Realtime Database (REST, path `/houses`).

- `index.html` — the board (Hebrew, RTL, mobile-first)
- `config.js` — Firebase database URL
- Listings are written nightly by a scheduled Claude scan (Yad2 + Madlan) through the browser on Nadav's computer.
