// Spotify: login (Authorization Code + PKCE, no server), token refresh,
// the user's playlists and every song in a playlist.

const Spotify = (() => {
  const CLIENT_ID = 'aa7bf7ca1c7a4c9b9364eb9f2a91c3ef';
  const SCOPES = 'playlist-read-private playlist-read-collaborative';
  // Must match a redirect URI saved in the Spotify app's settings exactly.
  const REDIRECT_URI = location.origin + location.pathname.replace(/index\.html$/, '');
  const API = 'https://api.spotify.com/v1';

  // Storage can throw in private windows; the page still works for one visit.
  const mem = {};
  const store = {
    get(k) { try { return sessionStorage.getItem(k) ?? mem[k] ?? null; } catch { return mem[k] ?? null; } },
    set(k, v) { mem[k] = v; try { sessionStorage.setItem(k, v); } catch {} },
    del(k) { delete mem[k]; try { sessionStorage.removeItem(k); } catch {} },
  };

  const base64url = (bytes) => btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  // 48 random bytes → 64 URL-safe characters, within PKCE's 43–128 range.
  const randomString = (n) => base64url(crypto.getRandomValues(new Uint8Array(n)));

  async function challengeFor(verifier) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return base64url(new Uint8Array(hash));
  }

  async function login() {
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

  function saveTokens(data) {
    store.set('hl-token', data.access_token);
    if (data.refresh_token) store.set('hl-refresh', data.refresh_token);
  }

  async function tokenRequest(body) {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
    });
    if (!res.ok) {
      const err = new Error('Spotify didn’t accept the login (' + res.status + '). Tap Connect Spotify again.');
      err.status = 401;
      throw err;
    }
    saveTokens(await res.json());
  }

  // Finishes a login if Spotify just sent the person back here. Returns
  // false when there's nothing to finish.
  async function handleRedirect() {
    const q = new URLSearchParams(location.search);
    if (!q.get('code') && !q.get('error')) return false;
    history.replaceState(null, '', REDIRECT_URI);
    if (q.get('error')) {
      throw new Error(q.get('error') === 'access_denied'
        ? 'You tapped Cancel on Spotify. Tap Connect Spotify to try again.'
        : 'Spotify login failed: ' + q.get('error'));
    }
    const verifier = store.get('hl-verifier');
    if (!verifier || q.get('state') !== store.get('hl-state')) {
      throw new Error('The Spotify login didn’t finish in this tab. Tap Connect Spotify again.');
    }
    store.del('hl-verifier');
    store.del('hl-state');
    await tokenRequest({ grant_type: 'authorization_code', code: q.get('code'), redirect_uri: REDIRECT_URI, code_verifier: verifier });
    return true;
  }

  const isLoggedIn = () => !!store.get('hl-token');

  function logout() {
    store.del('hl-token');
    store.del('hl-refresh');
  }

  // Access tokens last an hour; a game can run longer, so refresh once on 401.
  async function refresh() {
    const rt = store.get('hl-refresh');
    if (!rt) return false;
    try {
      await tokenRequest({ grant_type: 'refresh_token', refresh_token: rt });
      return true;
    } catch {
      return false;
    }
  }

  async function api(urlOrPath) {
    const url = urlOrPath.startsWith('http') ? urlOrPath : API + urlOrPath;
    let refreshed = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + store.get('hl-token') } });
      if (res.status === 429) {
        const wait = Number(res.headers.get('Retry-After') || 2);
        await new Promise((r) => setTimeout(r, Math.min(wait, 30) * 1000));
        continue;
      }
      if (res.status === 401 && !refreshed) {
        refreshed = true;
        if (await refresh()) continue;
      }
      if (res.ok) return res.json();
      const err = new Error('Spotify error ' + res.status);
      err.status = res.status;
      throw err;
    }
    throw new Error('Spotify is rate limiting us. Wait a minute and try again.');
  }

  function explain(err) {
    if (err.status === 401) return 'Your Spotify login expired. Tap Connect Spotify again.';
    if (err.status === 403) {
      return 'Spotify blocked this. While the app is in Development Mode, your Spotify account has to be added under Settings → User Management in the developer dashboard, and you can only load playlists you own or collaborate on.';
    }
    if (err instanceof TypeError) return 'Couldn’t reach Spotify. Check your connection and try again.';
    return err.message || 'Something went wrong talking to Spotify.';
  }

  const me = () => api('/me');

  async function playlists(onProgress) {
    const all = [];
    let next = '/me/playlists?limit=50';
    while (next) {
      const page = await api(next);
      all.push(...page.items.filter(Boolean));
      onProgress && onProgress(all.length, page.total);
      next = page.next;
    }
    return all;
  }

  // Playlist objects moved from `tracks` to `items` in the Feb 2026 API; accept both.
  const totalOf = (pl) => (pl.items && pl.items.total) ?? (pl.tracks && pl.tracks.total) ?? 0;

  // The smallest image that's still sharp at `px` CSS pixels on a 2x screen.
  function imageUrl(images, px) {
    const imgs = (images || []).filter(Boolean);
    if (!imgs.length) return null;
    const fit = imgs.filter((i) => !i.width || i.width >= px * 2).sort((x, y) => (x.width || 9999) - (y.width || 9999));
    return (fit[0] || imgs[0]).url;
  }

  // Every playable song in a playlist, as plain objects. Local files,
  // podcast episodes and removed songs are counted in `skipped`.
  async function songs(pl, onProgress) {
    const out = [];
    let skipped = 0;
    let seen = 0;
    let next = '/playlists/' + pl.id + '/items?limit=50';
    while (next) {
      const page = await api(next);
      for (const row of page.items) {
        seen++;
        const t = row.item || row.track; // `track` was renamed `item` in Feb 2026
        if (!t || t.is_local || t.type === 'episode' || !t.id) { skipped++; continue; }
        out.push({
          id: t.id,
          title: t.name,
          artists: (t.artists || []).map((a) => a.name),
          durationMs: t.duration_ms || 0,
          cover: imageUrl(t.album && t.album.images, 160),
          url: (t.external_urls && t.external_urls.spotify) || 'https://open.spotify.com/track/' + t.id,
        });
      }
      onProgress && onProgress(seen, page.total);
      next = page.next;
    }
    return { songs: out, skipped };
  }

  return { login, handleRedirect, isLoggedIn, logout, api, explain, me, playlists, songs, totalOf, imageUrl };
})();
