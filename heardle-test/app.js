// Playlist Load Test
// Logs in with Spotify (Authorization Code + PKCE, no server), lists the
// user's playlists, and loads every song of the one they tap, page by page,
// so we can confirm the full playlist comes through.

const CLIENT_ID = 'aa7bf7ca1c7a4c9b9364eb9f2a91c3ef';
const SCOPES = 'playlist-read-private playlist-read-collaborative';
// Must match a redirect URI saved in the Spotify app's settings exactly.
const REDIRECT_URI = location.origin + location.pathname.replace(/index\.html$/, '');
const API = 'https://api.spotify.com/v1';

const $ = (id) => document.getElementById(id);

// Storage can throw in private windows; the page still works for one visit.
const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  del(k) { try { sessionStorage.removeItem(k); } catch {} },
};
let memToken = null;
const getToken = () => memToken || store.get('hl-token');

function show(section) {
  for (const id of ['connect', 'pick', 'result']) $(id).hidden = id !== section;
}

function showError(msg) {
  $('error').textContent = msg;
  $('error').hidden = !msg;
}

// ---- Login (PKCE) ----

const base64url = (bytes) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// 48 random bytes → 64 URL-safe characters, within PKCE's 43–128 range.
const randomString = (n) => base64url(crypto.getRandomValues(new Uint8Array(n)));

async function challengeFor(verifier) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(hash));
}

async function login() {
  const btn = $('connect-btn');
  btn.disabled = true;
  btn.textContent = 'Opening Spotify…';
  const verifier = randomString(48);
  const state = randomString(16);
  store.set('hl-verifier', verifier);
  store.set('hl-state', state);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: await challengeFor(verifier),
    scope: SCOPES,
    state,
  });
  location.assign('https://accounts.spotify.com/authorize?' + params);
}

async function finishLogin(code, state) {
  // Clean the code out of the address bar either way.
  history.replaceState(null, '', REDIRECT_URI);
  const verifier = store.get('hl-verifier');
  if (!verifier || state !== store.get('hl-state')) {
    throw new Error('The Spotify login didn’t finish in this tab. Tap Connect Spotify again.');
  }
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  store.del('hl-verifier');
  store.del('hl-state');
  if (!res.ok) throw new Error('Spotify didn’t accept the login (' + res.status + '). Tap Connect Spotify again.');
  const data = await res.json();
  memToken = data.access_token;
  store.set('hl-token', data.access_token);
}

function logout() {
  memToken = null;
  store.del('hl-token');
  showError('');
  show('connect');
  $('connect-btn').disabled = false;
  $('connect-btn').textContent = 'Connect Spotify';
}

// ---- API ----

async function api(urlOrPath) {
  const url = urlOrPath.startsWith('http') ? urlOrPath : API + urlOrPath;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + getToken() } });
    if (res.status === 429) {
      const wait = Number(res.headers.get('Retry-After') || 2);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    if (res.ok) return res.json();
    const err = new Error('Spotify error ' + res.status);
    err.status = res.status;
    throw err;
  }
  throw new Error('Spotify is rate limiting us. Wait a minute and try again.');
}

function explain(err) {
  if (err.status === 401) return 'Your Spotify login expired. Tap Disconnect, then connect again.';
  if (err.status === 403) {
    return 'Spotify blocked this. While the app is in Development Mode, your Spotify account has to be added under Settings → User Management in the developer dashboard, and you can only load playlists you own or collaborate on.';
  }
  return err.message || 'Something went wrong talking to Spotify.';
}

// Playlist objects moved from `tracks` to `items` in the Feb 2026 API; accept both.
const totalOf = (pl) => (pl.items && pl.items.total) ?? (pl.tracks && pl.tracks.total) ?? 0;

let me = null;
let playlists = []; // in Spotify's library order: most recently created or saved first

// The smallest cover Spotify offers that's still sharp at 48px (96px on retina).
function coverUrl(pl) {
  const imgs = (pl.images || []).filter(Boolean);
  if (!imgs.length) return null;
  const fit = imgs.filter((i) => !i.width || i.width >= 96).sort((x, y) => (x.width || 999) - (y.width || 999));
  return (fit[0] || imgs[0]).url;
}

const NOTE_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="16.5" cy="16" r="2.5" fill="currentColor"/></svg>';

async function loadPlaylists() {
  show('pick');
  $('playlists').innerHTML = '';
  $('pick-status').textContent = 'Loading your playlists…';
  me = await api('/me');
  $('who').textContent = 'Connected as ' + (me.display_name || me.id) + '.';

  const all = [];
  let next = '/me/playlists?limit=50';
  while (next) {
    const page = await api(next);
    all.push(...page.items.filter(Boolean));
    $('pick-status').textContent = 'Loading your playlists… ' + all.length + ' of ' + page.total;
    next = page.next;
  }
  playlists = all;
  renderPlaylists();
}

function renderPlaylists() {
  const q = $('search').value.trim().toLowerCase();
  const sort = $('sort').value;
  let list = playlists.filter((pl) => !q || (pl.name || '').toLowerCase().includes(q));
  if (sort === 'oldest') list = list.slice().reverse();
  else if (sort === 'az') list = list.slice().sort((x, y) => x.name.localeCompare(y.name, undefined, { sensitivity: 'base', numeric: true }));
  else if (sort === 'most') list = list.slice().sort((x, y) => totalOf(y) - totalOf(x));
  else if (sort === 'fewest') list = list.slice().sort((x, y) => totalOf(x) - totalOf(y));

  if (!playlists.length) $('pick-status').textContent = 'No playlists found on this account.';
  else if (!list.length) $('pick-status').textContent = 'No playlists match “' + $('search').value.trim() + '”.';
  else if (q) $('pick-status').textContent = list.length + ' of ' + playlists.length + ' playlists';
  else $('pick-status').textContent = playlists.length + ' playlists';

  const frag = document.createDocumentFragment();
  for (const pl of list) {
    const mine = pl.owner && pl.owner.id === me.id;
    const readable = mine || pl.collaborative;
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pl';
    b.disabled = !readable;
    const url = coverUrl(pl);
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
    meta.textContent = totalOf(pl) + ' songs · by ' + (pl.owner.display_name || pl.owner.id) +
      (readable ? '' : ' · can’t load: only the owner can');
    b.append(cover, name, meta);
    b.addEventListener('click', () => loadSongs(pl).catch((e) => showError(explain(e))));
    li.append(b);
    frag.append(li);
  }
  $('playlists').replaceChildren(frag);
}

async function loadSongs(pl) {
  showError('');
  show('result');
  const expected = totalOf(pl);
  $('result-name').textContent = pl.name;
  $('result-verdict').textContent = '';
  $('result-verdict').className = 'verdict';
  $('result-breakdown').textContent = '';
  $('songs').innerHTML = '';
  $('result-count').textContent = '0 / ' + expected;

  const rows = [];
  let next = '/playlists/' + pl.id + '/items?limit=50';
  while (next) {
    const page = await api(next);
    rows.push(...page.items);
    $('result-count').textContent = rows.length + ' / ' + page.total + ' loading…';
    next = page.next;
  }

  let songs = 0, local = 0, other = 0;
  const frag = document.createDocumentFragment();
  for (const row of rows) {
    const t = row.item || row.track; // `track` was renamed `item` in Feb 2026
    const li = document.createElement('li');
    if (!t) { other++; li.className = 'off'; li.textContent = 'Unavailable item'; }
    else if (t.is_local) { local++; li.className = 'off'; li.textContent = t.name + ' (local file)'; }
    else if (t.type === 'episode') { other++; li.className = 'off'; li.textContent = t.name + ' (podcast episode)'; }
    else {
      songs++;
      li.textContent = t.name + ' — ' + (t.artists || []).map((a) => a.name).join(', ');
    }
    frag.append(li);
  }
  $('songs').append(frag);

  const pass = rows.length >= expected;
  $('result-count').textContent = rows.length + ' / ' + expected + ' loaded';
  $('result-verdict').textContent = pass
    ? 'Every item in the playlist came through.'
    : 'Only ' + rows.length + ' of ' + expected + ' came through.';
  $('result-verdict').classList.add(pass ? 'verdict--pass' : 'verdict--fail');
  const n = (k, one, many) => k + ' ' + (k === 1 ? one : many);
  $('result-breakdown').textContent = n(songs, 'song', 'songs') +
    (local ? ' · ' + n(local, 'local file', 'local files') + ' (can’t be played)' : '') +
    (other ? ' · ' + n(other, 'unavailable or podcast item', 'unavailable or podcast items') : '');
}

// ---- Start ----

$('connect-btn').addEventListener('click', () => login().catch((e) => showError(e.message)));
$('logout-btn').addEventListener('click', logout);
$('search').addEventListener('input', renderPlaylists);
$('sort').addEventListener('change', renderPlaylists);
$('back-btn').addEventListener('click', () => { showError(''); show('pick'); });

(async function start() {
  const q = new URLSearchParams(location.search);
  try {
    if (q.get('error')) {
      history.replaceState(null, '', REDIRECT_URI);
      throw new Error(q.get('error') === 'access_denied'
        ? 'You tapped Cancel on Spotify. Tap Connect Spotify to try again.'
        : 'Spotify login failed: ' + q.get('error'));
    }
    if (q.get('code')) await finishLogin(q.get('code'), q.get('state'));
    if (getToken()) await loadPlaylists();
    else show('connect');
  } catch (e) {
    $('pick-status').textContent = '';
    if (!getToken() || e.status === 401) logout();
    showError(explain(e));
  }
})();
