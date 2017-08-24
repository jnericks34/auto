'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This service provides cost calculation related operations
 * @author TCSCODER
 * @version 1.0
 */

const _ = require('lodash');
const Joi = require('joi');
const logger = require('../../common/logger');
const jsonfile = require('fs-extra');
const cp = require('child_process');
const csv = require('csvtojson');
const config = require('config');

const parameterConfiguration = jsonfile.readJsonSync('data/parameters.json');

// prepares the results from output
function* _prepareResult(isAutomate, parameters) {
  const file = isAutomate ? config.PATHS.AutomateYes : config.PATHS.AutomateNo;
  const params = _.sortBy(parameters,function(param){return parseInt(param.split(':')[0]);});
  const param = params.join(',')

  const output = cp.execFileSync(file, [param], {
    encoding: 'utf8'
  });

  const result = yield new Promise((resolve, reject) => {
    csv({
      delimiter: '\t'
    })
      .fromString(output)
      .on('end_parsed', (jsonObj) => {
        resolve(jsonObj);
      })
      .on('error', (error) => {
        reject(error);
      });
  });

  const mapping = jsonfile.readJsonSync('data/columnMapping.json');

  return _.mapValues(mapping, item => ({
    displayName: item.displayName,
    data: _(result).map(valueItem => ({
      time: _.toNumber(valueItem.Time),
      value: _.toNumber(valueItem[_.toString(item.column)])
    })).pickBy(r => r.time % 200 === 0 || r.time === 365).toArray()
      .value()
  }));
}

/**
 * Computes the estimation for given input
 * @param {String} isAutomate the flag whether to use 'BermudaAutomate_Yes_v1.1' or 'BermudaAutomate_No_v1.1' executable
 * @param {String} parameters the parameters value with index
 * @return {Object} the result
 */
function* estimate(isAutomate, parameters) {
  const formattedParameter = [];

  _.forEach(parameters, item => formattedParameter.push(`${item.parameterIndex}:${item.value}`));
  return yield _prepareResult(isAutomate, formattedParameter);
}

estimate.schema = {
  isAutomate: Joi.boolean().required(),
  parameters: Joi.array().unique('parameterIndex').items(Joi.object().keys({
    parameterIndex: Joi.number().integer().min(0).max(21)
      .required(),
    value: Joi.number().min(0).required()
  }))
};

function* _calculateSensitivity(isAutomate, otherParameter, parameterDetail) {
  logger.debug(`otherParameter: ${otherParameter}`);
  logger.debug(`parameterDetail: ${parameterDetail}`);
  const result = [];
  const len = config.SENSITIVITY_POINTS_PERCENTAGE.length;
  for (let i = 0; i < len; i += 1) {
    const value = parameterDetail.min + ((parameterDetail.max - parameterDetail.min) * config.SENSITIVITY_POINTS_PERCENTAGE[i] / 100);
    const formattedParameter = _.clone(otherParameter);
    formattedParameter.push({
      value,
      parameterIndex: parameterDetail.parameterIndex
    });
    const inputParam = [];
    _.forEach(formattedParameter, item => inputParam.push(`${item.parameterIndex}:${item.value}`));
    const values = yield _prepareResult(isAutomate, inputParam);
    const dataValue = _.chain(values.totalCosts.data)
      .pickBy(r => r.time === config.SENSITIVITY_DATA_POINT_TIME_VALUE).toArray()
      .first()
      .get('value')
      .value();
    result.push(dataValue);
  }
  return result;
  // generates dummy data for fast visual difference
  // const rand = function (max, min) {  
  //   return Math.floor(Math.random() * ((max - min) + 1)) + min;
  // };
  // return yield Array.apply(null, { length: 11 }).map(rand.bind(0, 101, 20));
}


function* sensitivity(isAutomate, parameters, sensitivityParameterIndex) {
  const listParameter = _.concat(parameterConfiguration.operational.costs, parameterConfiguration.operational.rates,
    parameterConfiguration.strategic, parameterConfiguration.tactical);
  _.remove(parameters, { parameterIndex: sensitivityParameterIndex }); // remove param value for which sensitivity is to calculated
  const parameterDetail = _.find(listParameter, ['parameterIndex', sensitivityParameterIndex]);
  logger.debug(`parameters: ${parameters}`);

  return yield _calculateSensitivity(isAutomate, parameters, parameterDetail);
}

sensitivity.schema = {
  isAutomate: Joi.boolean().required(),
  parameters: Joi.array().unique('parameterIndex').items(Joi.object().keys({
    parameterIndex: Joi.number().integer().min(0).max(21)
      .required(),
    value: Joi.number().min(0).required()
  })),
  sensitivityParameterIndex: Joi.number().integer().min(0).max(21)
};

module.exports = {
  estimate,
  sensitivity
};

logger.buildService(module.exports);
