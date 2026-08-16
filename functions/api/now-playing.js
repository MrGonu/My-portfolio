const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";

export async function onRequestGet(context) {
  const { env } = context;
  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = env.SPOTIFY_REFRESH_TOKEN;

  const offline = (status = 200) => Response.json({ status: "offline", isPlaying: false }, { status, headers: { "Cache-Control": "no-store" } });
  if (!clientId || !clientSecret || !refreshToken) return offline(503);

  try {
    const basic = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Authorization": `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken })
    });
    if (!tokenResponse.ok) return offline(502);
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return offline(502);

    const playbackResponse = await fetch(NOW_PLAYING_URL, {
      headers: { "Authorization": `Bearer ${tokenData.access_token}` }
    });
    if (playbackResponse.status === 204) return offline();
    if (!playbackResponse.ok) return offline(502);

    const playback = await playbackResponse.json();
    const item = playback?.item;
    if (!item) return offline();

    return Response.json({
      status: playback.is_playing ? "playing" : "paused",
      isPlaying: Boolean(playback.is_playing),
      title: item.name || "Unknown track",
      artist: Array.isArray(item.artists) ? item.artists.map(a => a.name).join(", ") : "Unknown artist",
      album: item.album?.name || "",
      url: item.external_urls?.spotify || "",
      progressMs: playback.progress_ms ?? 0,
      durationMs: item.duration_ms ?? 0
    }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache" } });
  } catch (_) {
    return offline(502);
  }
}
