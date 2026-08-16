# Gaurav Nepal — Portfolio v2 (Cloudflare Pages backend replacement)

This version keeps the supplied portfolio UI intact. `index.html` and `style.css` are unchanged. The only frontend edit is the existing Spotify polling block so it can display playing/paused/offline states while keeping the same card and styling.

## Backend change

- Flask `app.py` removed from the deployable project.
- Cloudflare Pages Function added at `/api/now-playing`.
- Spotify credentials are read from server-side environment variables.
- The browser still calls `/api/now-playing`, so the rest of the site does not need a backend URL change.

## Local test

Create `.dev.vars` beside `index.html`:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

Then run:

```cmd
npm install
npx wrangler pages dev .
```

Open the URL Wrangler prints (normally `http://localhost:8788`).

## Production

Deploy this folder as a Cloudflare Pages project and add the same three values as encrypted environment variables/secrets for the Pages Functions. Never commit `.dev.vars`.

`get_refresh_token.py` remains as the local one-time helper for generating your Spotify refresh token. It is not used by Cloudflare at runtime.
