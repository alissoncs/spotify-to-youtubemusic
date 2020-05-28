const SpotifyService = require('./SpotifyService');
const HttpServer = require('./HttpServer');
const inquirer = require('inquirer');
const chalk = require('chalk');
var CLI = require('clui'),
    Spinner = CLI.Spinner;

class Runner {
  constructor(deps = {}) {
    this.httpServer = new HttpServer();
    this.inquirer = deps.inquirer || inquirer;
    this.spotifyService = deps.spotifyService || new SpotifyService({
      httpServer: this.httpServer,
    });
  }
  async start() {
    const countdown = new Spinner('Starting your local server', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);

    countdown.start();
    this.httpServer.start(function() {
    });

    countdown.message('Loading for your Spotify login');
    await this.spotifyService.auth();
    countdown.stop();

    countdown.message('Loading your playlists');
    countdown.start();
    const playlists = await this.spotifyService.listAllPlaylists();
    countdown.stop();

    let promptResult = await this.inquirer.prompt({
      type: 'checkbox',
      name: 'choosePlaylist',
      message: 'Which playlist do you wanna choose?',
      choices: playlists.map(p => p.name),
    });
    countdown.message('Loading the tracks');
    countdown.start();

    const tracks = await this.spotifyService.listTracksByPlaylistNames(playlists, promptResult.choosePlaylist);
    countdown.stop();

    promptResult = await this.inquirer.prompt({
      type: 'checkbox',
      name: 'choosePlaylist',
      message: 'We found these tracks. Which playlist do you wanna import?',
      choices: tracks.map(p => `${p.name} - Songs: ${p.total_tracks}`),
    });

    console.info('tracks', tracks[0].tracks);

    // TODO

  }
}

module.exports = Runner;
