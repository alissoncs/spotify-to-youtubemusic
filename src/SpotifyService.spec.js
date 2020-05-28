const SpotifyService = require('./SpotifyService');
const Browser = require('./Browser');
const sinon = require('sinon');
const assert = require('assert');

describe('SpotifyService', () => {
  let mockBrowser;

  beforeEach(() => {
    mockBrowser = new Browser();
  });

  it('auth should open browser url', () => {
    const mock = sinon.stub(mockBrowser, 'open');
    mock.callsFake((param) => {

      assert.deepEqual(param, {
        url: 'https://accounts.spotify.com/authorizeresponse_type=code&client_id=123&scope=playlist-read-private&scope=playlist-read-collaborative'
      });

    });
    const service = new SpotifyService({
      browser: mockBrowser,
    });
    service.auth();
    assert.ok(mock.called, 'should be called');
  });

});
