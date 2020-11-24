require('dotenv').config();
const express = require('express');
const app = express();
const logger = require('./services/log')({ file: __filename });
const db = require('./config/db');
const elastic = require('./config/elastic');
const initialize = require('./config/files');

app.use(require('cors')());
app.use(express.json());
db().then(dbInstance => {
  initialize(app, dbInstance);
  elastic();

  app.use('**', (req, res) => {
    res.status(404).send('Not Found');
  });

  app.listen(process.env.PORT, () =>
    logger.info(`Server is listening on port ${process.env.PORT}`)
  );
});
