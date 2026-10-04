const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const PASS = process.env.ADMIN_PASSWORD || 'admin123';
const DATA_DIR = process.env.DATA_DIR || __dirname;
const FILE = path.join(DATA_DIR, 'data.json');
const LEGAL_TYPES = new Set(['', 'b', 'lb']);
const clean = (s, n = 40) => (typeof s === 'string' ? s.trim().replace(/\s+/g, ' ').slice(0, n) : '');
const validStart = s => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(s));
const validTossDecision = s => ['batting', 'bowling'].includes(s || '');
const squadKey = side => (side === 'A' ? 'squadA' : side === 'B' ? 'squadB' : null);
function withDefaults(m) {
  m.startsAt = m.startsAt || '';
  m.squadA = m.squadA || [];
  m.squadB = m.squadB || [];
  m.break = Boolean(m.break);
  m.winner = m.winner || '';
  m.toss = m.toss || { status: 'idle', wonBy: '', decision: '', announced: false };
  m.toss.status = m.toss.announced ? 'announced' : m.toss.status || 'idle';
  m.current = m.current || { striker: '', nonStriker: '', bowler: '' };
  m.current.striker = m.current.striker || '';
  m.current.nonStriker = m.current.nonStriker || '';
  m.current.bowler = m.current.bowler || '';
  return m;
}
function normalizeWicket(raw) {
  if (raw === false || raw === null || raw === undefined) return false;
  if (raw === true) return { type: 'bowled', fielder: '', catcher: '', wicketkeeper: '', runOutBy: '', note: '' };
  if (typeof raw === 'string') return { type: raw.toLowerCase(), fielder: '', catcher: '', wicketkeeper: '', runOutBy: '', note: '' };
  if (typeof raw !== 'object') return null;
  const type = String(raw.type || raw.kind || 'bowled').toLowerCase();
  return {
    type,
    fielder: clean(raw.fielder || raw.outby || raw.by || '', 60),
    catcher: clean(raw.catcher || raw.fieldedBy || '', 60),
    wicketkeeper: clean(raw.wicketkeeper || raw.wk || '', 60),
    runOutBy: clean(raw.runOutBy || raw.runner || '', 60),
    outPlayer: clean(raw.outPlayer || '', 60),
    newBatter: clean(raw.newBatter || '', 60),
    note: clean(raw.note || '', 80)
  };
}

if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
  throw new Error('Set ADMIN_PASSWORD before starting in production.');
}

let matches = [];
try {
  matches = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!Array.isArray(matches)) throw new Error('Expected a JSON array of matches.');
} catch (error) {
  if (error.code !== 'ENOENT') throw new Error(`Could not load ${FILE}: ${error.message}`);
}

matches.forEach(withDefaults);

function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(matches));
  fs.renameSync(temp, FILE);
}

const tokens = new Set();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

for (const file of ['admin.js', 'charts.js', 'fx.js', 'add-match.html', 'matches.html', 'teams.html']) {
  app.get(`/${file}`, (req, res, next) => {
    res.sendFile(path.join(__dirname, file), error => error && next(error));
  });
}

const auth = (req, res, next) => tokens.has(req.get('x-token'))
  ? next()
  : res.status(401).json({ error: 'Login required' });

app.get('/api/session', auth, (req, res) => res.json({ ok: true }));

const find = (req, res, next) => {
  req.match = matches.find(match => match.id === req.params.id);
  return req.match ? next() : res.status(404).json({ error: 'Match not found' });
};

function publish(match) {
  save();
  io.emit('match', match);
  return match;
}

function totals(innings) {
  return innings.balls.reduce((score, ball) => {
    score.runs += Number.isFinite(ball.bat) ? ball.bat : (ball.r || 0);
    score.runs += Number.isFinite(ball.extra) ? ball.extra : 0;
    if (ball.w) score.wickets++;
    if (LEGAL_TYPES.has(ball.t || '')) score.legalBalls++;
    return score;
  }, { runs: 0, wickets: 0, legalBalls: 0 });
}

function inningsComplete(match, index) {
  const innings = match.innings[index];
  if (!innings) return false;
  const score = totals(innings);
  if (score.wickets >= 10 || score.legalBalls >= match.overs * 6) return true;
  if (index === 1 && score.runs > totals(match.innings[0]).runs) return true;
  return false;
}

app.post('/api/login', (req, res) => {
  if (req.body?.password !== PASS) return res.status(401).json({ error: 'Wrong password' });
  const token = crypto.randomBytes(32).toString('hex');
  tokens.add(token);
  return res.json({ token });
});

app.get('/api/matches', (req, res) => res.json(matches));

app.post('/api/matches', auth, (req, res) => {
  const { teamA, teamB, overs, title, startsAt } = req.body || {};
  if (typeof teamA !== 'string' || !teamA.trim() || typeof teamB !== 'string' || !teamB.trim()) {
    return res.status(400).json({ error: 'Enter both team names' });
  }
  const parsedOvers = overs === undefined || overs === '' ? 20 : Number(overs);
  if (!Number.isInteger(parsedOvers) || parsedOvers < 1 || parsedOvers > 50) {
    return res.status(400).json({ error: 'Overs must be a whole number from 1 to 50' });
  }
  if (startsAt && !validStart(startsAt)) return res.status(400).json({ error: 'Enter a valid date and time' });
  const match = {
    id: crypto.randomBytes(8).toString('hex'),
    title: typeof title === 'string' ? title.trim().slice(0, 100) : '',
    teamA: teamA.trim().slice(0, 60),
    teamB: teamB.trim().slice(0, 60),
    overs: parsedOvers,
    status: 'upcoming',
    break: false,
    winner: '',
    startsAt: startsAt || '',
    squadA: [],
    squadB: [],
    current: { striker: '', nonStriker: '', bowler: '' },
    toss: { status: 'idle', wonBy: '', decision: '', announced: false },
    result: '',
    innings: []
  };
  matches.unshift(match);
  return res.status(201).json(publish(match));
});

app.post('/api/matches/:id/innings', auth, find, (req, res) => {
  const match = req.match;
  const index = match.innings.length;
  if (match.status === 'completed') return res.status(400).json({ error: 'Match is already finished' });
  if (index >= 2) return res.status(400).json({ error: 'Both innings already started' });
  if (index === 1 && !inningsComplete(match, 0)) {
    return res.status(400).json({ error: 'Finish the first innings before starting the second' });
  }
  const tossBatting = match.toss?.announced
    ? match.toss.decision === 'batting' ? match.toss.wonBy : match.toss.wonBy === match.teamA ? match.teamB : match.teamA
    : '';
  const team = index === 0 ? (req.body?.team || tossBatting || match.teamA)
    : (match.innings[0].team === match.teamA ? match.teamB : match.teamA);
  if (index === 0 && team !== match.teamA && team !== match.teamB) {
    return res.status(400).json({ error: 'Choose one of the match teams to bat' });
  }
  match.innings.push({ team, balls: [] });
  match.status = 'live';
  match.break = false;
  match.result = '';
  return res.json(publish(match));
});

app.post('/api/matches/:id/ball', auth, find, (req, res) => {
  const match = req.match;
  const index = match.innings.length - 1;
  const innings = match.innings[index];
  if (!innings || match.status !== 'live') return res.status(400).json({ error: 'Start an innings first' });
  if (match.break) return res.status(400).json({ error: 'Resume the match before scoring' });
  if (inningsComplete(match, index)) return res.status(400).json({ error: 'This innings is complete' });

  const body = req.body || {};
  const { t = '', striker = '', nonStriker = '', bowler = '' } = body;
  const type = ['wd', 'nb', 'b', 'lb', 'dead'].includes(t) ? t : '';
  const legacyRuns = body.bat === undefined && type;
  const rawBat = body.bat ?? (legacyRuns ? 0 : body.r ?? 0);
  const rawExtra = body.extra ?? (legacyRuns ? body.r ?? (type === 'dead' ? 0 : 1) : ['wd', 'nb', 'b', 'lb'].includes(type) ? 1 : 0);
  const bat = Number(rawBat);
  const extra = Number(rawExtra);
  const wicket = normalizeWicket(body.w ?? body.wicket ?? body.dismissal ?? body.out ?? false);
  const fieldingSquad = innings.team === match.teamA ? match.squadB : match.squadA;
  const battingSquad = innings.team === match.teamA ? match.squadA : match.squadB;
  if (!Number.isInteger(bat) || bat < 0 || bat > 6 || !Number.isInteger(extra) || extra < 0 || extra > 7) {
    return res.status(400).json({ error: 'Runs must be whole numbers in the supported range' });
  }
  if (type === 'wd' && bat !== 0) return res.status(400).json({ error: 'Wide deliveries cannot add batter runs' });
  if ((type === 'b' || type === 'lb') && bat !== 0) return res.status(400).json({ error: 'Bye/leg-bye deliveries cannot add batter runs' });
  if ((type === 'wd' || type === 'nb') && extra < 1) {
    return res.status(400).json({ error: 'Wide and no-ball deliveries include at least one penalty run' });
  }
  if (type === 'dead' && (bat !== 0 || extra !== 0 || wicket)) {
    return res.status(400).json({ error: 'A dead ball cannot add runs or a wicket' });
  }
  if (wicket && wicket.type) {
    const eligibleFielders = new Set(fieldingSquad.map(name => name.toLowerCase()));
    for (const name of [wicket.catcher, wicket.fielder, wicket.wicketkeeper, wicket.runOutBy].filter(Boolean)) {
      if (!eligibleFielders.has(name.toLowerCase())) {
        return res.status(400).json({ error: `${name} must be selected from the bowling team` });
      }
    }
    const eligibleBatters = new Set(battingSquad.map(name => name.toLowerCase()));
    for (const name of [wicket.outPlayer, wicket.newBatter].filter(Boolean)) {
      if (!eligibleBatters.has(name.toLowerCase())) {
        return res.status(400).json({ error: `${name} must be selected from the batting team` });
      }
    }
    if (wicket.outPlayer && wicket.newBatter && wicket.outPlayer.toLowerCase() === wicket.newBatter.toLowerCase()) {
      return res.status(400).json({ error: 'Choose a different replacement batter' });
    }
  }

  const ball = {
    bat,
    extra,
    t: type,
    w: wicket && wicket.type ? wicket : false,
    striker: typeof striker === 'string' ? striker.slice(0, 60) : '',
    nonStriker: typeof nonStriker === 'string' ? nonStriker.slice(0, 60) : '',
    bowler: typeof bowler === 'string' ? bowler.slice(0, 60) : '',
    outPlayer: wicket && wicket.type ? wicket.outPlayer : '',
    newBatter: wicket && wicket.type ? wicket.newBatter : ''
  };
  ball.r = bat + extra;
  innings.balls.push(ball);
  const nextStriker = clean(body.nextStriker, 60) || (ball.outPlayer === ball.striker ? ball.newBatter : '') || ball.striker;
  const nextNonStriker = clean(body.nextNonStriker, 60) || (ball.outPlayer === ball.nonStriker ? ball.newBatter : '') || ball.nonStriker;
  if (nextStriker) match.current.striker = nextStriker;
  if (nextNonStriker) match.current.nonStriker = nextNonStriker;
  if (ball.bowler) match.current.bowler = ball.bowler;
  if (inningsComplete(match, index)) ball.inningsComplete = true;
  return res.json(publish(match));
});

app.post('/api/matches/:id/undo', auth, find, (req, res) => {
  const match = req.match;
  const innings = match.innings[match.innings.length - 1];
  if (!innings || !innings.balls.length || match.status !== 'live') {
    return res.status(400).json({ error: 'No ball to undo' });
  }
  innings.balls.pop();
  return res.json(publish(match));
});

app.post('/api/matches/:id/break', auth, find, (req, res) => {
  if (req.match.status !== 'live') return res.status(400).json({ error: 'Only a live match can be paused' });
  req.match.break = req.body?.paused === undefined ? !req.match.break : Boolean(req.body.paused);
  return res.json(publish(req.match));
});

app.post('/api/matches/:id/finish', auth, find, (req, res) => {
  const match = req.match;
  if (!match.innings.length) return res.status(400).json({ error: 'Start at least one innings before finishing' });
  const first = totals(match.innings[0]);
  const second = match.innings[1] ? totals(match.innings[1]) : null;
  let winner = '';
  let automaticResult = '';
  if (second) {
    if (first.runs === second.runs) automaticResult = 'Match tied';
    else if (second.runs > first.runs) {
      winner = match.innings[1].team;
      automaticResult = `${winner} won by ${10 - second.wickets} wickets`;
    } else {
      winner = match.innings[0].team;
      automaticResult = `${winner} won by ${first.runs - second.runs} runs`;
    }
  }
  match.status = 'completed';
  match.break = false;
  match.winner = winner || [match.teamA, match.teamB].find(team => String(req.body?.result || '').toLowerCase().startsWith(team.toLowerCase())) || '';
  match.result = typeof req.body?.result === 'string' && req.body.result.trim()
    ? req.body.result.trim().slice(0, 200)
    : automaticResult || 'Match finished';
  return res.json(publish(match));
});

app.post('/api/matches/:id/schedule', auth, find, (req, res) => {
  const startsAt = req.body?.startsAt || '';
  if (startsAt && !validStart(startsAt)) return res.status(400).json({ error: 'Enter a valid date and time' });
  req.match.startsAt = startsAt;
  return res.json(publish(req.match));
});

app.post('/api/matches/:id/squad', auth, find, (req, res) => {
  const key = squadKey(req.body?.side);
  const name = clean(req.body?.name);
  if (!key || !name) return res.status(400).json({ error: 'Choose a team and enter a player name' });
  const list = req.match[key];
  const allNames = [...req.match.squadA, ...req.match.squadB].map(player => player.toLowerCase());
  if (list.length >= 20) return res.status(400).json({ error: 'A squad can have up to 20 players' });
  if (allNames.includes(name.toLowerCase())) {
    return res.status(400).json({ error: 'That player is already assigned to a team in this match' });
  }
  list.push(name);
  return res.json(publish(req.match));
});

app.delete('/api/matches/:id/squad', auth, find, (req, res) => {
  const key = squadKey(req.body?.side);
  if (!key) return res.status(400).json({ error: 'Choose a team' });
  req.match[key] = req.match[key].filter(player => player !== req.body?.name);
  return res.json(publish(req.match));
});

app.post('/api/matches/:id/current', auth, find, (req, res) => {
  req.match.current = {
    striker: clean(req.body?.striker, 60),
    nonStriker: clean(req.body?.nonStriker, 60),
    bowler: clean(req.body?.bowler, 60)
  };
  return res.json(publish(req.match));
});

app.post('/api/matches/:id/toss/start', auth, find, (req, res) => {
  if (req.match.innings.length || req.match.status === 'completed') {
    return res.status(400).json({ error: 'The toss must happen before the innings start' });
  }
  if (req.match.toss?.announced) return res.status(400).json({ error: 'The toss has already been announced' });
  req.match.toss = { status: 'flipping', wonBy: '', decision: '', announced: false, startedAt: Date.now() };
  return res.json(publish(req.match));
});

app.post('/api/matches/:id/toss', auth, find, (req, res) => {
  const { wonBy, decision } = req.body || {};
  if (req.match.toss?.status !== 'flipping') {
    return res.status(400).json({ error: 'Start the toss before announcing the result' });
  }
  if (req.match.innings.length || req.match.status === 'completed') {
    return res.status(400).json({ error: 'The toss must be announced before the innings start' });
  }
  if (wonBy !== req.match.teamA && wonBy !== req.match.teamB) {
    return res.status(400).json({ error: 'Choose a valid team that won the toss' });
  }
  if (!validTossDecision(decision)) {
    return res.status(400).json({ error: 'Choose batting or bowling as the toss decision' });
  }
  req.match.toss = { status: 'announced', wonBy, decision, announced: true };
  if (!req.match.status || req.match.status === 'completed') {
    req.match.status = req.match.status === 'completed' ? 'completed' : 'upcoming';
  }
  return res.json(publish(req.match));
});

app.delete('/api/matches/:id', auth, find, (req, res) => {
  matches = matches.filter(match => match !== req.match);
  save();
  io.emit('removed', req.match.id);
  return res.json({ ok: true });
});

server.listen(PORT, () => console.log(`Scoreboard running on http://localhost:${PORT}  (admin: /admin.html)`));