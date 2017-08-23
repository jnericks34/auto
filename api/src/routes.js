'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */
/**
 * Contains all routes
 * @author TCSCODER
 * @version 1.0
 */

module.exports = {
  '/calculate': {
    post: { controller: 'CalculatorController', method: 'estimate' }
  },
  '/scenarios': {
    post: { controller: 'ScenarioController', method: 'create' },
    get: { controller: 'ScenarioController', method: 'getAll' }
  },
  '/scenarios/share': {
    post: { controller: 'ScenarioController', method: 'share' },
  },
  '/scenarios/:id': {
    put: { controller: 'ScenarioController', method: 'update' },
    get: { controller: 'ScenarioController', method: 'get' },
    delete: { controller: 'ScenarioController', method: 'remove' }
  },
  '/sensitivity/:parameterIndex': {
    post: { controller: 'CalculatorController', method: 'sensitivity' }
  }
};
