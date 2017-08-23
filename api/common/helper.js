'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This file defines helper methods
 * @author TCSCODER
 * @version 1.0
 */

const _ = require('lodash');
const co = require('co');
const errors = require('./errors');
const Joi = require('joi');
const S = require('string');

/**
 * Check if value is defined or not and throws errors
 * @param {Object} value
 * @param {Object} Model
 * @param {Object|Number} criteria
 * @param {Boolean} throwsNotFound
 * @private
 */
function _checkExists(value, Model, criteria, throwsNotFound) {
  if (!value) {
    const msg = `${S(Model.modelName).humanize().s} does not exist with ${_.isObject(criteria) ? JSON.stringify(_.omit(criteria, ['include'])) : 'id: ' + criteria}`;
    throw throwsNotFound ? new errors.NotFoundError(msg) : new errors.BadRequestError(msg);
  }
}

/**
 * Wrap generator function to standard express function
 * @param {Function} fn the generator function
 * @returns {Function} the wrapped function
 */
function wrapExpress(fn) {
  return function wrapGenerator(req, res, next) {
    co(fn(req, res, next)).catch(next);
  };
}

/**
 * Wrap all generators from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
function autoWrapExpress(obj) {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress);
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'GeneratorFunction') {
      return wrapExpress(obj);
    }
    return obj;
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value);
  });
  return obj;
}


/**
 * Find a entity matching the given criteria.
 * @param {Object} Model the model to query
 * @param {Object|String|Number} criteria the criteria (if object) or id (if string/number)
 * @return {Object} the entity
 * @private
 */
function findOne(Model, criteria) {
  let query;
  if (_.isObject(criteria)) {
    query = Model.findOne(criteria);
  } else {
    query = Model.findById(criteria);
  }
  return query;
}

/**
 * Ensure entity exists for given criteria. Throw error if no result
 * @param {Object} Model the model to query
 * @param {Object|String|Number} criteria the criteria (if object) or id (if string/number)
 * @param {Boolean} throwsNotFound true to throw NotFoundError, otherwise throw BadRequestError
 * @param {String} paramName the optional name of the parameter to be validated
 * @return {Object} the existed entity
 */
function* ensureExist(Model, criteria, throwsNotFound) {
  const result = yield findOne(Model, criteria);
  _checkExists(result, Model, criteria, throwsNotFound);
  return result;
}

const parameterValueSchema = Joi.array().unique('parameterIndex').items(Joi.object().keys({
  parameterIndex: Joi.number().integer().min(0).max(21)
    .required(),
  value: Joi.number().min(0).required()
}));

module.exports = {
  wrapExpress,
  autoWrapExpress,
  ensureExist,
  parameterValueSchema
};
