const open = require('open');

class Browser {
  constructor(deps = {}) {
    this.openLib = deps.open || open;
  }
  async open({ url, options }) {
    console.info('browser will open', url);
    this.openLib(url, options || {wait: true});
  }
}

module.exports = Browser;
