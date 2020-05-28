const qs = require('querystring');
const assert = require('assert');
const axios = require('axios');
const Browser = require('./Browser');

class SpotifyService {

  constructor(deps = {}) {
    this.browser = deps.browser || new Browser();
    this.httpServer = deps.httpServer;

    this.AUTH_URL = 'https://accounts.spotify.com/authorize';
    this.CLIENT_ID = deps.CLIENT_ID || process.env.SPOTIFY_CLIENT_ID;
    this.CLIENT_SECRET = deps.CLIENT_SECRET || process.env.SPOTIFY_CLIENT_SECRET;

    this.axios = deps.axios || axios.create({
      baseURL: 'https://accounts.spotify.com/api/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: this.getBase64AuthorizationCode(),
      }
    });
    this.axios.interceptors.response.use(function (response) {
      return response;
    }, this.handleRequestSpotifyError);

    this.httpServer.setSpotifyResponse(this.onSpotifyAuthResponse.bind(this));

    assert.ok(this.browser, 'browser dep required');
    assert.ok(this.CLIENT_ID, 'CLIENT_ID dep required');
    assert.ok(this.CLIENT_SECRET, 'CLIENT_SECRET dep required');
  }

  handleRequestSpotifyError(error) {
    if (error.response) {
      error.message = error.message +', ' + JSON.stringify(error.response.data);
    }
    return Promise.reject(error);
  }

  getBase64AuthorizationCode() {
    const clientId = this.CLIENT_ID;
    const clientSecret = this.CLIENT_SECRET;

    const base = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    return `Basic ${base}`;
  }

  setTokenInfo(token) {
    this.token = token;
  }

  async onSpotifyAuthResponse(req) {
    assert.ok(req.query && req.query.code, 'Spotify auth code is missing');
    const { code } = req.query;

    let tokenResponse;

    try {
      const data = qs.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        redirect_uri: this.httpServer.SPOTIFY_AUTH_RESPONSE_URL,
      });
      tokenResponse = await this.axios.post('https://accounts.spotify.com/api/token', data, {
        headers: {
          Authorization: this.getBase64AuthorizationCode(),
        }
      });
      this.setTokenInfo(tokenResponse.data);

      await this.listAllPlaylists();

    } catch (err) {
      throw new Error('Failed to request Spotify access token: ' + err.message);
    }

  }

  async auth() {
    const queryCode = {
      response_type: 'code',
      client_id: this.CLIENT_ID,
      scope: ['playlist-read-private', 'playlist-read-collaborative'].join(' '),
      redirect_uri: this.httpServer.SPOTIFY_AUTH_RESPONSE_URL,
    };

    const query = qs.encode(queryCode);
    await this.browser.open({
      url: this.AUTH_URL + '?' + query,
    });

    return await new Promise((resolve, reject) => {
      const myInterval = setInterval(() => {
        if (this.token) {
          clearInterval(myInterval);
          resolve(this.token);
        }
      }, 1000);
    });
  }

  async listAllPlaylists() {
    assert.ok(this.token, 'token required to list playlists');
    let playlistResponse;
    try {
      playlistResponse = await this.axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: 'Bearer ' + this.token.access_token,
        }
      });
      return playlistResponse.data && playlistResponse.data.items;
    } catch(err) {
      throw new Error('Failed to request Spotify playlists: ' + err.message);
    }
  }

  async listTracksByPlaylistNames(playlists, names) {
    assert.ok(this.token, 'token required to list playlists');

    const filteredPlaylists = playlists.filter(p => names.indexOf(p.name) >= 0);
    const requests = filteredPlaylists.map(playlist => {
      return this.axios.get(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        headers: {
          Authorization: 'Bearer ' + this.token.access_token,
        }
      }).then((res) => {
        return {
          ...playlist,
          total_tracks: res.data.items.length,
          tracks: res.data.items,
        };
      })
    })
    const allResponses = await Promise.all(requests);
    return allResponses;
  }

}

module.exports = SpotifyService;
