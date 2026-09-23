import { handleSearch } from '../../server/search'

// Netlify Functions (v2 signature). Set YOUTUBE_API_KEY in the site's
// environment variables; without it the app falls back to search links.
export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const client = req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-forwarded-for') ?? 'anon'
  const r = await handleSearch(url.searchParams, { apiKey: process.env.YOUTUBE_API_KEY, client, apiUrl: process.env.YOUTUBE_API_URL })
  return new Response(JSON.stringify(r.body), { status: r.status, headers: r.headers })
}
