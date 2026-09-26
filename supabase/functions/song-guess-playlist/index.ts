// Song Guess: reads a public Spotify playlist for someone who doesn't own it.
// Spotify's Web API only returns a playlist's songs to its owner or a
// collaborator, so this reads the public embed page instead (the one Spotify
// serves for embedding a playlist on a website). Browsers can't read that
// page from another site, which is why this runs on a server.
//
// The embed page lists the first 100 songs only; `total` says how many the
// playlist really has, so the game can say "100 of 155".
//
// No secrets, no database. Public GET, answers only the Song Guess origins.
//
// Deploy: supabase functions deploy song-guess-playlist --no-verify-jwt

const ALLOWED = [
  'https://seanjoudrie.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8000',
]
const UA = 'Mozilla/5.0 (compatible; SongGuess/1.0; +https://seanjoudrie.github.io/SeanJoudrie/heardle-test/)'
const ID = /^[A-Za-z0-9]{22}$/

async function idFromLink(link: string): Promise<string | null> {
  const direct = link.match(/playlist[/:]([A-Za-z0-9]{22})(?![A-Za-z0-9])/)
  if (direct) return direct[1]
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return null
  }
  // Share links from the Spotify app (spotify.link/…) redirect to the playlist.
  if (!/^(spotify\.link|spotify\.app\.link)$/.test(url.hostname)) return null
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  const found = (res.url + ' ' + (await res.text())).match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]{22})(?![A-Za-z0-9])/)
  return found ? found[1] : null
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    Vary: 'Origin',
  }
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
      },
    })

  try {
    const q = new URL(req.url).searchParams
    const id = q.get('id') || (q.get('link') ? await idFromLink(q.get('link')!) : null)
    if (!id || !ID.test(id)) return json({ error: 'not_a_playlist' }, 400)

    const [embed, page] = await Promise.all([
      fetch(`https://open.spotify.com/embed/playlist/${id}`, { headers: { 'User-Agent': UA } }),
      fetch(`https://open.spotify.com/playlist/${id}`, { headers: { 'User-Agent': UA } }).catch(() => null),
    ])
    if (embed.status === 404) return json({ error: 'not_found' }, 404)
    if (!embed.ok) return json({ error: 'spotify_' + embed.status }, 502)

    const html = await embed.text()
    const data = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    const entity = data && JSON.parse(data[1])?.props?.pageProps?.state?.data?.entity
    if (!entity || !Array.isArray(entity.trackList)) return json({ error: 'not_found' }, 404)

    const songs = entity.trackList
      .filter((t: { uri?: string }) => t.uri?.startsWith('spotify:track:'))
      .map((t: { uri: string; title: string; subtitle?: string; duration?: number }) => ({
        id: t.uri.split(':')[2],
        title: t.title,
        artists: String(t.subtitle || '').split(', ').filter(Boolean),
        durationMs: t.duration || 0,
      }))

    let total = entity.trackList.length
    if (page && page.ok) {
      const count = (await page.text()).match(/music:song_count" content="(\d+)"/)
      if (count) total = Math.max(total, Number(count[1]))
    }

    return json({
      id,
      name: entity.name || entity.title || 'Playlist',
      owner: entity.subtitle || '',
      image: entity.coverArt?.sources?.[0]?.url ?? null,
      total,
      songs,
    })
  } catch (e) {
    return json({ error: 'failed', detail: String(e).slice(0, 200) }, 500)
  }
})
