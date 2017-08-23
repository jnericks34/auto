'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Controller for scenario endpoints
 * @author TCSCODER
 * @version 1.0
 */
const service = require('../services/ScenarioService');

/**
 * Get all scenarios
 * @param req the request
 * @param res the response
 */
function* getAll(req, res) {
  const result = yield service.getAll();
  res.send(result);
}

/**
 * Creates a scenario
 * @param req the request
 * @param res the response
 */
function* create(req, res) {
  const result = yield service.create(req.body);
  res.send(result);
}

/**
 * Get a detail of scenario
 * @param req the request
 * @param res the response
 */
function* get(req, res) {
  const result = yield service.get(req.params.id);
  res.send(result);
}

/**
 * Deletes a saved scenario
 * @param req the request
 * @param res the response
 */
function* remove(req, res) {
  const result = yield service.remove(req.params.id);
  res.send(result);
}

function* update(req, res) {
  const result = yield service.update(req.params.id, req.body);
  res.send(result);
}

function* share(req, res) {
  const result = yield service.share(req.body);
  res.send(result);
}

module.exports = {
  getAll,
  create,
  get,
  remove,
  update,
  share
};
