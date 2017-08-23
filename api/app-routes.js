'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Configure all routes for express app
 * @author TCSCODER
 * @version 1.0
 */

const _ = require('lodash');
const config = require('config');
const helper = require('./common/helper');
const routes = require('./src/routes');

/**
 * Configure all routes for express app
 * @param app the express app
 */
module.exports = (app) => {
  // Load all routes
  _.each(routes, (verbs, path) => {
    _.each(verbs, (def, verb) => {
      const controllerPath = `./src/controllers/${def.controller}`;
      const method = require(controllerPath)[def.method]; // eslint-disable-line
      if (!method) {
        throw new Error(`${def.method} is undefined`);
      }
      const actions = [];
      actions.push((req, res, next) => {
        req.signature = `${def.controller}#${def.method}`;
        next();
      });
      actions.push(method);
      app[verb](`/v${config.API_VERSION}${path}`, helper.autoWrapExpress(actions));
    });
  });
};
