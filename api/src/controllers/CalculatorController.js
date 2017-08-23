'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Controller for parameters endpoints
 * @author TCSCODER
 * @version 1.0
 */
const service = require('../services/CalculatorService');

function* estimate(req, res) {
  const result = yield service.estimate(req.query.isAutomate, req.body);

  res.send(result);
}

function* sensitivity(req, res) {
  const result = yield service.sensitivity(req.query.isAutomate, req.body, req.params.parameterIndex);

  res.send(result);
}

module.exports = {
  estimate,
  sensitivity
};
