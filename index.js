require('dotenv').config();
const Runner = require('./src/Runner');


const run = new Runner()
run
  .start()
  .then((res) => {
    console.info(res);
  })
  .catch(err => {
    console.error(err);
  });
