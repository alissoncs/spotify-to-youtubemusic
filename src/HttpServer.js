const restify = require('restify');

class HttpServer {
  constructor(deps = {}) {
    this.restify = deps.restify || restify;

    this.selfUrl = 'http://localhost:8081';
    this.SPOTIFY_AUTH_RESPONSE = '/spotify/auth/response';
    this.SPOTIFY_AUTH_RESPONSE_URL = this.selfUrl + this.SPOTIFY_AUTH_RESPONSE;
  }

  setSpotifyResponse(callback) {
    this.spotifyResponse = callback;
  }

  setYTMResponse(callback) {
    this.ymtResponse = callback;
  }

  errorResponse(req, res, err) {
    return res.send(500, {
      error: err.message,
    });
  }

  handle(callback) {
    return (req, res, next) => {
      Promise
        .resolve()
        .then(() => callback(req, res, next))
        .catch(err => this.errorResponse(req, res, err));
    };
  }

  start(callback) {
    const server = restify.createServer();
    server.use(restify.plugins.queryParser());

    server.get(this.SPOTIFY_AUTH_RESPONSE, this.handle(async (req, res, next) => {
      if (this.spotifyResponse) {
        await this.spotifyResponse({
          query: req.query,
          body: req.body,
        });
      }
      return res.send(201);
    }));

    server.get('/ymt/auth/response', (req, res, next) => {
      if (this.ymtResponse) {
        this.ymtResponse();
      }
      return res.send(201);
    });

    server.listen(8081, () => {
      console.info('HttpServer started at 8081');
      callback();
    });
  }
}

module.exports = HttpServer;
