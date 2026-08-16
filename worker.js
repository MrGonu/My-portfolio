const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL =
  "https://api.spotify.com/v1/me/player/currently-playing";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Spotify API endpoint
    if (url.pathname === "/api/now-playing" && request.method === "GET") {
      return getNowPlaying(env);
    }

    // Everything else is served as a normal static asset
    return env.ASSETS.fetch(request);
  },
};

async function getNowPlaying(env) {
  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = env.SPOTIFY_REFRESH_TOKEN;

  // Diagnostic offline response.
  // IMPORTANT: Never expose credentials or tokens here.
  const offline = (status = 200, reason = "unknown") =>
    Response.json(
      {
        status: "offline",
        isPlaying: false,
        reason,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

  // Check that Cloudflare has the production secrets.
  if (!clientId || !clientSecret || !refreshToken) {
    return offline(503, "missing_credentials");
  }

  try {
    // Create Spotify Basic Authentication header.
    const basic = btoa(`${clientId}:${clientSecret}`);

    // Exchange refresh token for a fresh access token.
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    // Spotify rejected the token request.
    if (!tokenResponse.ok) {
      return offline(502, "token_request_failed");
    }

    const tokenData = await tokenResponse.json();

    // Spotify responded but didn't provide an access token.
    if (!tokenData.access_token) {
      return offline(502, "no_access_token");
    }

    // Ask Spotify for the user's current playback.
    const playbackResponse = await fetch(NOW_PLAYING_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    // Spotify uses 204 when there is no currently available playback.
    if (playbackResponse.status === 204) {
      return offline(200, "no_active_playback");
    }

    // Spotify rejected the playback request.
    if (!playbackResponse.ok) {
      return offline(502, "playback_request_failed");
    }

    const playback = await playbackResponse.json();
    const item = playback?.item;

    // Playback exists but doesn't contain a track.
    if (!item) {
      return offline(200, "no_track");
    }

    // Successful response.
    return Response.json(
      {
        status: playback.is_playing ? "playing" : "paused",
        isPlaying: Boolean(playback.is_playing),
        title: item.name || "Unknown track",
        artist: Array.isArray(item.artists)
          ? item.artists.map((a) => a.name).join(", ")
          : "Unknown artist",
        album: item.album?.name || "",
        url: item.external_urls?.spotify || "",
        progressMs: playback.progress_ms ?? 0,
        durationMs: item.duration_ms ?? 0,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (_) {
    // Unexpected Worker-side error.
    return offline(502, "worker_exception");
  }
}