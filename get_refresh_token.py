"""
Run this ONCE to get a Spotify refresh token for your own account.

pip install flask requests
python get_refresh_token.py
-> opens http://localhost:8888/login in your browser, log in with the
   Spotify account you want the site to read from, approve access, and
   the refresh token will be printed in this terminal (and shown in the
   browser). Copy it into the SPOTIFY_REFRESH_TOKEN environment variable.
"""

import os
import webbrowser
import requests
from flask import Flask, request, redirect

CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "")
REDIRECT_URI = "http://localhost:8888/callback"
SCOPE = "user-read-currently-playing user-read-playback-state"

app = Flask(__name__)


@app.route("/login")
def login():
    params = (
        f"?client_id={CLIENT_ID}&response_type=code&redirect_uri={REDIRECT_URI}"
        f"&scope={SCOPE.replace(' ', '%20')}"
    )
    return redirect("https://accounts.spotify.com/authorize" + params)


@app.route("/callback")
def callback():
    code = request.args.get("code")
    resp = requests.post(
        "https://accounts.spotify.com/api/token",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
        },
        auth=(CLIENT_ID, CLIENT_SECRET),
        timeout=8,
    )
    data = resp.json()
    refresh_token = data.get("refresh_token", "NOT RETURNED — check the error below")
    print("\nSPOTIFY_REFRESH_TOKEN =", refresh_token, "\n")
    print("Full response:", data)
    return f"<pre>Refresh token (also printed in your terminal):\n\n{refresh_token}</pre>"


if __name__ == "__main__":
    if not (CLIENT_ID and CLIENT_SECRET):
        print("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env vars first.")
    webbrowser.open("http://localhost:8888/login")
    app.run(port=8888)
