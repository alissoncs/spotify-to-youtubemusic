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
    console.info(chalk.green('Starting prompt server...'));

    const countdown = new Spinner('Loading the Spotify page', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);

    countdown.start();
    this.httpServer.start(function() {
    });

    await this.spotifyService.auth();
    countdown.stop();

    const playlists = await this.spotifyService.listAllPlaylists();

    const promptResult = await this.inquirer.prompt({
      type: 'checkbox',
      name: 'choose_playlist',
      message: 'Which playlist do you wanna import?',
      choices: playlists.map(p => p.name),
    });
  }
}

module.exports = Runner;
