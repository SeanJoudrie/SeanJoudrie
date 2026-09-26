# Song Guess (early test)

Guess songs from your own Spotify playlists, one clip at a time. Connect Spotify, tap one or more playlists, tap Play. Every song is loaded (not just the first 100), repeats are removed, and the order is shuffled. Each song starts as a 1-second clip; every wrong guess or skip unlocks more: 1s, 2s, 4s, 7s, 11s, 16s.

Live at https://seanjoudrie.github.io/SeanJoudrie/heardle-test/. It stays at this address because it's the redirect URI saved in the Spotify app.

## How it works

| File | What it does |
|---|---|
| `spotify.js` | Spotify login (Authorization Code with PKCE, straight from the browser, no server or client secret), token refresh, playlists, every song in a playlist |
| `clips.js` | Title clean-up and matching (`Text`), and 30-second clips from Deezer's public search API (`Clips`) |
| `app.js` | Screens: connect, pick playlists, loading, guessing, reveal, end |

- **Clips come from Deezer, not Spotify.** Spotify's API stopped giving out preview clips in 2024. Each song is looked up on Deezer by title and artist when it comes up (and one song ahead). Deezer doesn't allow cross-site `fetch()`, so this uses its JSONP API.
- **Matching prefers the original recording.** Same title and one of the same artists, then no version words, then closest length. A live or acoustic version is used only when Deezer has nothing closer, and the reveal names it. Remixes, demos, other takes, karaoke and covers are never used. Songs with no match are skipped and counted at the end. Against a real 100-song playlist, 96 matched.
- **Deezer clip links expire after about 15 minutes.** A found clip is reused for 10 minutes. One that fails to play is fetched once more before the song is skipped.

## Limits

- **Spotify:** a playlist's songs are only returned to its owner or a collaborator. While the Spotify app is in Development Mode, only accounts added under Settings → User Management in the developer dashboard can connect (5 max). Spotify's developer policy also says not to build games on its platform, so this can't go public as it is.
- **Deezer:** check Deezer's API terms before any public launch.

## Run locally

Serve the folder (`python3 -m http.server 8000`) and add `http://127.0.0.1:8000/` as a redirect URI in the Spotify app. Spotify doesn't accept `localhost`.
