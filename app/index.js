require('dotenv').config();
const express = require('express');
const app = express();
const logger = require('./services/log')({ file: __filename });
const morgan = require('morgan');
const services = require('./config');
const db = require('./config/db');
const initialize = require('./core');

app.use(require('cors')());
app.use(express.json());
app.use(morgan('dev'));

db.init().then(dbInstance => {
  initialize(app, dbInstance, services);

  /**
   * Error handling middleware
   */
  app.use((err, req, resp, next) => {
    if (err) {
      log.error(err.message, { stack: err.stack, code: err.statusCode });
      return resp.status(err.statusCode || 400).json({ message: err.message });
    }

    return next();
  });

  app.use('**', (req, res) => {
    res.status(404).send('Not Found');
  });

  app.listen(process.env.PORT, () =>
    logger.info(`Server is listening on port ${process.env.PORT}`)
  );
});
