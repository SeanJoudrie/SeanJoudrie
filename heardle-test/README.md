# Playlist load test

A one-page check, before the song-guessing game is built, that a whole Spotify playlist loads (not just the first 100 songs the embed page gives).

Connect Spotify, tap one of your playlists, and it loads every song page by page and shows `loaded / total`.

- **Login:** Spotify Authorization Code with PKCE, straight from the browser. No server and no client secret.
- **Limits:** Spotify only returns a playlist's songs to its owner or a collaborator. While the Spotify app is in Development Mode, only accounts added under Settings → User Management in the developer dashboard can connect (5 max).
- **Live at:** https://seanjoudrie.github.io/SeanJoudrie/heardle-test/ (this exact URL is the redirect URI saved in the Spotify app).
- **Run locally:** serve the folder (`python3 -m http.server`) and add `http://127.0.0.1:8000/` as a redirect URI in the Spotify app. Spotify doesn't accept `localhost`.
