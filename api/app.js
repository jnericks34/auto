'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Initialize and start express application
 * @author TCSCODER
 * @version 1.0
 */

require('./bootstrap');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
const helmet = require('helmet');
const config = require('config');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const _ = require('lodash');
const logger = require('./common/logger');
const cors = require('cors');
const models = require('./src/models');

const app = express();

app.use(cors());

app.use(helmet());
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else if (process.env.NODE_ENV === 'production') {
  app.use(morgan('common', { skip: (req, res) => res.statusCode < 400 }));
}

// Register routes
require('./app-routes')(app);

// The error handler, log error and return 500 error
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.logFullError(err, req.signature || `${req.method} ${req.url}`);
  const errorResponse = {};
  const status = err.isJoi ? 400 : err.httpStatus || 500;

  if (_.isArray(err.details)) {
    if (err.isJoi) {
      _.map(err.details, (e) => {
        if (e.message) {
          if (_.isUndefined(errorResponse.message)) {
            errorResponse.message = e.message;
          } else {
            errorResponse.message += `, ${e.message}`;
          }
        }
      });
    }
  }
  if (_.isUndefined(errorResponse.message)) {
    if (err.message) {
      errorResponse.message = err.message;
    } else {
      errorResponse.message = 'Server error';
    }
  }

  res.status(status).send(errorResponse);
});

// Initialize Sequelize ORM and start listening
models.init().then(() => {
  app.listen(config.PORT, process.env.IP);
  logger.info('Express server listening on port %d in %s mode', config.PORT, process.env.NODE_ENV);
});

