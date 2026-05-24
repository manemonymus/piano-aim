# 🎹 Piano Aim

A fast-paced reflex game inspired by Piano Tiles. Click the black tiles before the timer runs out — but don't miss.



# 🔗 **[Play Now](https://pianoaim.com)**

---

## How to Play

- A 4x4 grid appears with 3 black tiles
- Click a black tile — it disappears and a new one spawns somewhere else
- Every correct click scores a point and plays a piano note
- Click a white tile → instant game over
- You have **30 seconds** — how high can you score?
- Press any key to restart after a game over

---

## Features

-  Canvas-based rendering for zero-lag click detection
-  Procedural piano sounds using the Web Audio API (pentatonic scale)
-  Global leaderboard powered by Supabase — top 10 scores worldwide
-  Local high score saved in your browser
-  One spot per player on the leaderboard — only your best score counts
-  Only qualifies for leaderboard if score beats the current top 10

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla JS, HTML, CSS |
| Rendering | HTML5 Canvas |
| Audio | Web Audio API |
| Database | Supabase (PostgreSQL) |
| Hosting | Netlify |

---

## Running Locally

No build step required — just clone and open:

```bash
git clone https://github.com/manemonymus/piano-aim.git
cd piano-aim
```

Then open `index.html` in your browser. That's it.

---

## Architecture

The game loop runs entirely on a single HTML5 Canvas element. Click detection uses coordinate math on a single `mousedown` listener rather than per-tile event listeners, which eliminates missed clicks at high speed.

Audio is generated procedurally using the Web Audio API — no audio files needed. Each correct click plays a random note from a pentatonic scale, making rapid clicking sound musical rather than chaotic.

Scores are submitted directly to Supabase from the frontend using the Supabase JS client. Row Level Security policies ensure users can only insert and update their own scores.

---

## Anti-Cheat

- Score submissions are only triggered client-side after a valid game session
- Each player name can only hold one leaderboard entry — their personal best
- Leaderboard qualification is checked server-side before prompting for a name
