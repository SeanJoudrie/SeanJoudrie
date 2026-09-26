// Song Guess
// Connect Spotify → pick one or more playlists → every song is loaded,
// de-duplicated and shuffled → guess each one from a clip that grows
// 1s, 2s, 4s, 7s, 11s, 16s with every wrong guess or skip.

const STAGES = [1, 2, 4, 7, 11, 16];
const MAX = STAGES[STAGES.length - 1];

const $ = (id) => document.getElementById(id);
const SCREENS = ['s-connect', 's-pick', 's-loading', 's-game', 's-reveal', 's-done'];

function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  window.scrollTo(0, 0);
}

function showError(msg) {
  $('error').textContent = msg || '';
  $('error').hidden = !msg;
}

const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Pick playlists ----------

let me = null;
let playlists = []; // Spotify's library order: most recently created or saved first
const picked = new Set();

const NOTE_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="16.5" cy="16" r="2.5" fill="currentColor"/></svg>';
const CHECK_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

async function openPicker() {
  showError('');
  show('s-pick');
  if (playlists.length) { renderPlaylists(); return; }
  $('pick-status').textContent = 'Loading your playlists…';
  me = await Spotify.me();
  $('who').textContent = 'Connected as ' + (me.display_name || me.id) + '. Tap as many playlists as you like.';
  playlists = await Spotify.playlists((n, total) => {
    $('pick-status').textContent = 'Loading your playlists… ' + n + ' of ' + total;
  });
  renderPlaylists();
}

const readable = (pl) => (pl.owner && me && pl.owner.id === me.id) || pl.collaborative;

function renderPlaylists() {
  const q = $('search').value.trim().toLowerCase();
  const sort = $('sort').value;
  let list = playlists.filter((pl) => !q || (pl.name || '').toLowerCase().includes(q));
  if (sort === 'oldest') list = list.slice().reverse();
  else if (sort === 'az') list = list.slice().sort((x, y) => x.name.localeCompare(y.name, undefined, { sensitivity: 'base', numeric: true }));
  else if (sort === 'most') list = list.slice().sort((x, y) => Spotify.totalOf(y) - Spotify.totalOf(x));
  else if (sort === 'fewest') list = list.slice().sort((x, y) => Spotify.totalOf(x) - Spotify.totalOf(y));

  if (!playlists.length) $('pick-status').textContent = 'No playlists found on this account.';
  else if (!list.length) $('pick-status').textContent = 'No playlists match “' + $('search').value.trim() + '”.';
  else if (q) $('pick-status').textContent = list.length + ' of ' + plural(playlists.length, 'playlist', 'playlists');
  else $('pick-status').textContent = plural(playlists.length, 'playlist', 'playlists');

  const frag = document.createDocumentFragment();
  for (const pl of list) {
    const ok = readable(pl);
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pl';
    b.disabled = !ok;
    b.setAttribute('aria-pressed', String(picked.has(pl.id)));
    const url = Spotify.imageUrl(pl.images, 48);
    let cover;
    if (url) {
      cover = document.createElement('img');
      cover.src = url;
      cover.alt = '';
      cover.loading = 'lazy';
      cover.width = cover.height = 48;
    } else {
      cover = document.createElement('span');
      cover.innerHTML = NOTE_SVG;
    }
    cover.className = 'pl__cover';
    const name = document.createElement('span');
    name.className = 'pl__name';
    name.textContent = pl.name;
    const meta = document.createElement('span');
    meta.className = 'pl__meta';
    meta.textContent = plural(Spotify.totalOf(pl), 'song', 'songs') + ' · by ' + (pl.owner.display_name || pl.owner.id) +
      (ok ? '' : ' · only the owner can load it');
    const tick = document.createElement('span');
    tick.className = 'pl__tick';
    tick.innerHTML = CHECK_SVG;
    b.append(cover, name, meta, tick);
    b.addEventListener('click', () => {
      if (picked.has(pl.id)) picked.delete(pl.id); else picked.add(pl.id);
      b.setAttribute('aria-pressed', String(picked.has(pl.id)));
      updatePickBar();
    });
    li.append(b);
    frag.append(li);
  }
  $('playlists').replaceChildren(frag);
  updatePickBar();
}

function pickedPlaylists() {
  return playlists.filter((pl) => picked.has(pl.id));
}

function updatePickBar() {
  const sel = pickedPlaylists();
  const songs = sel.reduce((n, pl) => n + Spotify.totalOf(pl), 0);
  $('pick-summary').textContent = sel.length
    ? plural(sel.length, 'playlist', 'playlists') + ' · ' + plural(songs, 'song', 'songs')
    : 'Tap playlists to add them';
  $('play-btn').disabled = !sel.length;
}

// ---------- Load songs ----------

let pool = []; // every unique song from the picked playlists (also the guess list)
let queue = []; // shuffled songs still to play
let loadNote = '';

// One entry per song: the same track in two playlists, or the same song on
// a single and an album, counts once.
function dedupe(songs) {
  const byKey = new Map();
  for (const s of songs) {
    const key = Text.norm(Text.clean(s.title)) + '|' + Text.norm(s.artists[0]);
    if (!byKey.has(key)) byKey.set(key, s);
  }
  return [...byKey.values()];
}

async function loadSongs() {
  showError('');
  show('s-loading');
  const sel = pickedPlaylists();
  const all = [];
  let skipped = 0;
  for (let i = 0; i < sel.length; i++) {
    const label = sel.length > 1 ? 'Playlist ' + (i + 1) + ' of ' + sel.length + ': ' : '';
    $('loading-text').textContent = label + '0 / ' + Spotify.totalOf(sel[i]);
    const res = await Spotify.songs(sel[i], (n, total) => {
      $('loading-text').textContent = label + n + ' / ' + total;
    });
    all.push(...res.songs);
    skipped += res.skipped;
  }
  pool = dedupe(all);
  const dupes = all.length - pool.length;
  loadNote = [
    dupes ? plural(dupes, 'repeat', 'repeats') + ' removed' : '',
    skipped ? plural(skipped, 'local file or unavailable item', 'local files or unavailable items') + ' left out' : '',
  ].filter(Boolean).join(' · ');
  startGame();
}

// ---------- Game ----------

const audio = new Audio();
audio.preload = 'auto';
let stopAt = 0;
let raf = 0;

const game = {
  song: null,
  clip: null,
  stage: 0, // index into STAGES
  attempts: [], // { kind: 'wrong' | 'skip', text }
  played: 0,
  correct: 0,
  noClip: 0,
  pickedId: null, // song chosen from the suggestions
};

function startGame() {
  queue = shuffle(pool.slice());
  game.played = 0;
  game.correct = 0;
  game.noClip = 0;
  nextSong();
}

// Takes songs off the queue until one has a clip. Looks ahead one song so
// the next clip is usually ready by the time it's needed.
async function nextSong() {
  stopAudio();
  showError('');
  show('s-game');
  resetRound();
  $('clip-btn').disabled = true;
  $('clip-btn').textContent = 'Finding a song…';
  while (queue.length) {
    const song = queue.shift();
    const clip = await Clips.find(song);
    if (!clip) { game.noClip++; continue; }
    game.song = song;
    game.clip = clip;
    retried = false;
    audio.src = clip.preview;
    audio.load();
    if (queue[0]) Clips.find(queue[0]);
    renderRound();
    $('guess').focus({ preventScroll: true });
    return;
  }
  finish();
}

function resetRound() {
  game.song = null;
  game.clip = null;
  game.stage = 0;
  game.attempts = [];
  game.pickedId = null;
  $('guess').value = '';
  $('suggest').replaceChildren();
  $('clip-status').textContent = '';
  setMeter(0);
}

function renderRound() {
  const secs = STAGES[game.stage];
  $('game-meta').textContent = 'Song ' + (game.played + 1) + ' of ' + (game.played + 1 + queue.length) +
    ' · ' + game.correct + ' right';
  $('clip-btn').disabled = false;
  $('clip-btn').textContent = 'Play ' + plural(secs, 'second', 'seconds');
  const nextSecs = STAGES[game.stage + 1];
  $('skip-btn').textContent = nextSecs ? 'Skip (+' + (nextSecs - secs) + 's)' : 'Give up';
  $('meter').style.setProperty('--unlocked', String(secs / MAX));

  const frag = document.createDocumentFragment();
  for (let i = 0; i < STAGES.length; i++) {
    const li = document.createElement('li');
    const a = game.attempts[i];
    if (a) {
      li.className = 'attempt attempt--' + a.kind;
      li.textContent = a.kind === 'skip' ? 'Skipped' : a.text;
    } else {
      li.className = 'attempt' + (i === game.stage ? ' attempt--now' : '');
      li.textContent = i === game.stage ? 'Guess ' + (i + 1) + ' of ' + STAGES.length : '';
    }
    frag.append(li);
  }
  $('attempts').replaceChildren(frag);
}

// ---------- Audio ----------

function setMeter(seconds) {
  $('meter-fill').style.transform = 'scaleX(' + Math.min(seconds / MAX, 1) + ')';
}

function stopAudio() {
  audio.pause();
  cancelAnimationFrame(raf);
  $('reveal-play').textContent = 'Play clip';
}

function tick() {
  const t = audio.currentTime;
  if (!$('s-game').hidden) setMeter(t);
  if (t >= stopAt) {
    stopAudio();
    if (!$('s-game').hidden) setMeter(0);
    return;
  }
  raf = requestAnimationFrame(tick);
}

async function playFor(seconds) {
  stopAudio();
  stopAt = seconds;
  try {
    audio.currentTime = 0;
  } catch {}
  try {
    await audio.play();
    raf = requestAnimationFrame(tick);
    return true;
  } catch {
    return false;
  }
}

audio.addEventListener('waiting', () => { if (!$('s-game').hidden) $('clip-status').textContent = 'Loading the clip…'; });
audio.addEventListener('playing', () => { $('clip-status').textContent = ''; });
// A clip link can expire while someone thinks; fetch a fresh one once, and
// skip the song if that doesn't play either.
let retried = false;
audio.addEventListener('error', async () => {
  if (!game.song || !audio.getAttribute('src')) return;
  const song = game.song;
  if (!retried) {
    retried = true;
    const clip = await Clips.find(song, true);
    if (clip && game.song === song) {
      game.clip = clip;
      audio.src = clip.preview;
      audio.load();
      $('clip-status').textContent = 'The clip reloaded. Tap Play.';
      return;
    }
  }
  if (game.song !== song || $('s-game').hidden) return;
  $('clip-status').textContent = 'This clip wouldn’t play, so it was skipped.';
  game.noClip++;
  setTimeout(nextSong, 1200);
});

$('clip-btn').addEventListener('click', async () => {
  const ok = await playFor(STAGES[game.stage]);
  if (!ok) $('clip-status').textContent = 'Couldn’t start the clip. Tap Play again.';
});

// ---------- Guessing ----------

function suggestions(q) {
  const n = Text.norm(q);
  if (!n) return [];
  const words = n.split(' ');
  const hits = [];
  for (const s of pool) {
    const title = Text.norm(Text.clean(s.title));
    const hay = title + ' ' + Text.norm(s.artists.join(' '));
    if (!words.every((w) => hay.includes(w))) continue;
    hits.push({ s, rank: title.startsWith(n) ? 0 : title.includes(n) ? 1 : 2 });
  }
  hits.sort((a, b) => a.rank - b.rank || a.s.title.localeCompare(b.s.title));
  return hits.slice(0, 6).map((h) => h.s);
}

const label = (s) => Text.clean(s.title) + ' — ' + s.artists.join(', ');

$('guess').addEventListener('input', () => {
  game.pickedId = null;
  const frag = document.createDocumentFragment();
  for (const s of suggestions($('guess').value)) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'suggest__item';
    b.setAttribute('role', 'option');
    const t = document.createElement('span');
    t.className = 'suggest__title';
    t.textContent = Text.clean(s.title);
    const a = document.createElement('span');
    a.className = 'suggest__artist';
    a.textContent = s.artists.join(', ');
    b.append(t, a);
    b.addEventListener('click', () => {
      $('guess').value = label(s);
      game.pickedId = s.id;
      $('suggest').replaceChildren();
      $('submit-btn').focus();
    });
    li.append(b);
    frag.append(li);
  }
  $('suggest').replaceChildren(frag);
});

function isRight(text) {
  const song = game.song;
  if (game.pickedId) {
    const p = pool.find((s) => s.id === game.pickedId);
    return !!p && (p.id === song.id ||
      (Text.sameTitle(p.title, song.title) && Text.sameArtist(song.artists, p.artists[0])));
  }
  // Typed without choosing a suggestion: the title alone is enough.
  const typed = text.split(' — ')[0];
  return Text.norm(Text.clean(typed)) === Text.norm(Text.clean(song.title));
}

function advance(kind, text) {
  game.attempts.push({ kind, text });
  if (game.stage >= STAGES.length - 1) { reveal(false); return; }
  game.stage++;
  $('guess').value = '';
  game.pickedId = null;
  $('suggest').replaceChildren();
  renderRound();
  // Wrong guesses and skips were tapped, so the longer clip can play now.
  playFor(STAGES[game.stage]);
}

$('guess-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!game.song) return;
  const text = $('guess').value.trim();
  if (!text) { $('clip-status').textContent = 'Type a guess, or tap Skip to hear more.'; return; }
  if (isRight(text)) reveal(true);
  else advance('wrong', text);
});

$('skip-btn').addEventListener('click', () => {
  if (!game.song) return;
  advance('skip', '');
});

// ---------- Reveal and end ----------

function reveal(won) {
  game.played++;
  if (won) game.correct++;
  const s = game.song;
  const secs = STAGES[game.stage];
  $('reveal-result').textContent = won
    ? 'Got it in ' + plural(secs, 'second', 'seconds') + (game.stage === 0 ? '. First try.' : '.')
    : 'Not this time.';
  $('reveal-result').className = 'verdict ' + (won ? 'verdict--pass' : 'verdict--fail');
  $('reveal-title').textContent = Text.clean(s.title);
  $('reveal-artist').textContent = s.artists.join(', ');
  $('reveal-cover').hidden = !s.cover;
  if (s.cover) $('reveal-cover').src = s.cover;
  $('reveal-spotify').href = s.url;
  $('reveal-deezer').href = game.clip.link;
  // Say so when the clip is another recording, like a live version.
  const other = Text.norm(game.clip.title) !== Text.norm(Text.clean(s.title)) &&
    Text.norm(Text.clean(game.clip.title)) !== Text.norm(game.clip.title);
  $('reveal-deezer').textContent = other ? 'Clip from Deezer: ' + game.clip.title : 'Clip from Deezer';
  $('next-btn').textContent = queue.length ? 'Next song' : 'See your score';
  show('s-reveal');
  // Play the full clip as the answer; this follows the tap on Guess or Skip.
  playFor(30).then((ok) => { if (ok) $('reveal-play').textContent = 'Pause'; });
}

$('reveal-play').addEventListener('click', async () => {
  if (!audio.paused) { stopAudio(); return; }
  stopAt = 30;
  try {
    if (audio.currentTime >= 29.5) audio.currentTime = 0;
    await audio.play();
    raf = requestAnimationFrame(tick);
    $('reveal-play').textContent = 'Pause';
  } catch {}
});

$('next-btn').addEventListener('click', () => { if (queue.length) nextSong(); else finish(); });

function finish() {
  stopAudio();
  game.song = null;
  show('s-done');
  $('done-score').textContent = game.correct + ' / ' + game.played;
  $('done-detail').textContent = [
    plural(game.played, 'song', 'songs') + ' played',
    game.noClip ? plural(game.noClip, 'song', 'songs') + ' skipped because Deezer has no clip' : '',
    loadNote,
  ].filter(Boolean).join(' · ');
}

// ---------- Wiring ----------

function fail(e) {
  showError(Spotify.explain(e));
  if (e.status === 401) { Spotify.logout(); show('s-connect'); }
}

$('connect-btn').addEventListener('click', () => {
  $('connect-btn').disabled = true;
  $('connect-btn').textContent = 'Opening Spotify…';
  Spotify.login().catch((e) => {
    $('connect-btn').disabled = false;
    $('connect-btn').textContent = 'Connect Spotify';
    showError(e.message);
  });
});
$('logout-btn').addEventListener('click', () => {
  Spotify.logout();
  playlists = [];
  picked.clear();
  $('connect-btn').disabled = false;
  $('connect-btn').textContent = 'Connect Spotify';
  show('s-connect');
});
$('search').addEventListener('input', renderPlaylists);
$('sort').addEventListener('change', renderPlaylists);
$('play-btn').addEventListener('click', () => loadSongs().catch((e) => { show('s-pick'); fail(e); }));
for (const id of ['change-btn', 'done-change-btn']) {
  $(id).addEventListener('click', () => { stopAudio(); openPicker().catch(fail); });
}
$('again-btn').addEventListener('click', startGame);

(async function start() {
  try {
    await Spotify.handleRedirect();
    if (Spotify.isLoggedIn()) await openPicker();
    else show('s-connect');
  } catch (e) {
    show('s-connect');
    fail(e);
  }
})();
