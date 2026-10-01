# Live Cricket Scoreboard

Light-themed live scoreboard. Viewers see matches on `/`, tap one for the ball-by-ball view. The scorer logs in at `/admin.html` and taps each ball; every viewer updates instantly over Socket.IO.

## Run
    npm install
    ADMIN_PASSWORD=yourpassword npm start     # Windows: set ADMIN_PASSWORD=yourpassword && npm start
Open http://localhost:3000 and http://localhost:3000/admin.html. Local development uses `admin123` if `ADMIN_PASSWORD` is not set; always set a strong `ADMIN_PASSWORD` when deploying. Production startup fails if it is missing.

## Test
    npm test

## Deploy (Render / Railway)
Create a Node web service from this folder. Build: `npm install`, start: `npm start`. Set env var `ADMIN_PASSWORD`. For data that survives redeploys, attach a persistent disk and set `DATA_DIR` to its path (matches are stored in `data.json`).

## Scoring notes
Wide and No-ball include a one-run penalty and do not count as a legal ball. The scorer can add further extras and record batter runs from a No-ball. Byes count as legal balls. An innings ends after the selected overs or 10 wickets; the second innings also ends once the target is passed. Start the second innings only after the first is complete. Use Undo for mistakes and "Finish match" to record the result.
