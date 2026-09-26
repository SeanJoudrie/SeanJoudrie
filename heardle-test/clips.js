// Text matching and 30-second preview clips from Deezer's public search API.
// Deezer doesn't allow cross-site fetch() from browsers, so this uses the
// JSONP form of its API, which it supports for exactly that.

const Text = (() => {
  // "Song 2 - 2012 Remaster" → "Song 2"; "Can't Hold Us (feat. Ray Dalton)" → "Can't Hold Us".
  const SUFFIX = /\s+-\s+.*\b(remaster(ed)?|version|mono|stereo|bonus|edition|live|single|radio|edit|mix|remix|anniversary|deluxe|from|feat\.?|with|track)\b.*$/i;
  const BRACKET = /\s*[([](feat\.?|ft\.?|with|from|remaster(ed)?|bonus|live|mono|stereo|radio|explicit|\d{4})\b[^)\]]*[)\]]/gi;

  function clean(title) {
    const t = String(title || '').replace(SUFFIX, '').replace(BRACKET, '').trim();
    return t || String(title || '');
  }

  // Lowercase, accents and punctuation removed, "&" read as "and".
  function norm(s) {
    return String(s || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^\p{L}\p{N} ]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const sameTitle = (a, b) => {
    const x = norm(clean(a));
    const y = norm(clean(b));
    return !!x && !!y && (x === y || x.startsWith(y + ' ') || y.startsWith(x + ' '));
  };

  const sameArtist = (list, name) => {
    const n = norm(name);
    return list.some((a) => {
      const m = norm(a);
      return m && n && (m === n || m.includes(n) || n.includes(m));
    });
  };

  return { clean, norm, sameTitle, sameArtist };
})();

const Clips = (() => {
  let seq = 0;

  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const cb = '__dz' + ++seq;
      const s = document.createElement('script');
      const timer = setTimeout(() => { done(); reject(new Error('timeout')); }, 10000);
      function done() { clearTimeout(timer); delete window[cb]; s.remove(); }
      window[cb] = (data) => { done(); resolve(data); };
      s.onerror = () => { done(); reject(new Error('network')); };
      s.src = url + '&output=jsonp&callback=' + cb;
      document.head.append(s);
    });
  }

  async function search(q) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const d = await jsonp('https://api.deezer.com/search?limit=25&q=' + encodeURIComponent(q));
        // Code 4 is Deezer's "too many requests"; wait and try again.
        if (d && d.error) { await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); continue; }
        return (d && d.data) || [];
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    return [];
  }

  // Other recordings of the same song: used only when Deezer has nothing
  // closer, ranked after the original.
  const VERSION = /\b(live|acoustic|unplugged|unpeeled|edit|version|session|re ?recorded|extended)\b/g;
  // Sound different enough to be a different song: remixes, demos, other
  // takes, karaoke and sound-alike covers. Never used unless the Spotify
  // title says it's one too.
  const DIFFERENT = /\b(remix|rmx|mix|reprise|cover|club|rework|refreak|dub|vip|demo|take|bootleg|karaoke|instrumental|tribute|made famous|originally performed|in the style of|backing track|8d|sped up|slowed|lullaby)\b/g;

  const words = (s, re) => new Set(Text.norm(s).match(re) || []);

  // The result that is the same song: same title, one of the same artists,
  // the original recording before remixes and live versions, then the
  // closest length and most played. Returns null rather than a wrong song.
  function best(results, song) {
    const want = words(song.title, VERSION);
    const allowed = words(song.title + ' ' + song.artists.join(' '), DIFFERENT);
    const ok = results.filter((r) => r.preview && r.readable !== false && r.artist &&
      (Text.sameTitle(song.title, r.title_short || r.title) || Text.sameTitle(song.title, r.title)) &&
      Text.sameArtist(song.artists, r.artist.name) &&
      [...words(r.title + ' ' + r.artist.name, DIFFERENT)].every((w) => allowed.has(w)));
    if (!ok.length) return null;
    const score = (r) => {
      const extra = [...words(r.title, VERSION)].filter((w) => !want.has(w)).length;
      const exact = Text.norm(Text.clean(r.title)) === Text.norm(Text.clean(song.title)) ? 0 : 1;
      const len = song.durationMs ? Math.abs((r.duration || 0) * 1000 - song.durationMs) / 1000 : 0;
      return extra * 1000 + exact * 100 + Math.min(len, 60) - (r.rank || 0) / 1e6;
    };
    ok.sort((a, b) => score(a) - score(b));
    const r = ok[0];
    return { preview: r.preview, link: r.link, title: r.title, cover: (r.album && (r.album.cover_medium || r.album.cover)) || null };
  }

  // Deezer's clip links expire after about 15 minutes, so a found clip is
  // reused for 10 minutes at most. `fresh` skips the cache.
  const cache = new Map();
  const TTL = 10 * 60 * 1000;

  // A clip for a song, or null when Deezer doesn't have that recording.
  function find(song, fresh) {
    const hit = cache.get(song.id);
    if (hit && !fresh && Date.now() - hit.at < TTL) return hit.p;
    const p = (async () => {
      const title = Text.clean(song.title);
      const artist = song.artists[0] || '';
      for (const q of ['artist:"' + artist + '" track:"' + title + '"', artist + ' ' + title]) {
        const hit = best(await search(q), song);
        if (hit) return hit;
      }
      return null;
    })();
    cache.set(song.id, { p, at: Date.now() });
    return p;
  }

  return { find };
})();
