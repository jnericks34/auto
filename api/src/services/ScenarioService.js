'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This service provides scenario related operations
 * @author TCSCODER
 * @version 1.0
 */
const _ = require('lodash');
const Joi = require('joi');
const logger = require('../../common/logger');
const jsonfile = require('fs-extra');
const errors = require('../../common/errors');
const models = require('../models');
const helper = require('../../common/helper');
const nodemailer = require('nodemailer');
const config = require('config');

const parameters = jsonfile.readJsonSync('data/parameters.json');

const Scenario = models.Scenario;
const ScenarioParameterValue = models.ScenarioParameterValue;

const scenarioSchema = Joi.object().keys({
  id: Joi.number(),
  name: Joi.string().max(50).required(),
  isAutomate: Joi.boolean().required(),
  parameters: helper.parameterValueSchema.required().length(22)
});

const includeParameterValueOption = {
  model: ScenarioParameterValue,
  as: 'parameters'
};

let transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: config.SMTP_USERNAME,
        pass: config.SMTP_PASSWORD
    }
});

/**
 * Gets top N scenarios
 */
function* getAll() {
  return yield Scenario.findAll({ order: [['id', 'DESC']]});
}

/**
 * mock service to save scenario
 */
function* create(payload) {
  payload.createdAt = new Date();
  payload.updatedAt = null;
  const entity = yield Scenario.create(payload, {
    include: [includeParameterValueOption]
  });
  return yield get(entity.id);
}

create.schema = {
  payload: scenarioSchema
};

/**
 * mock service to get scenario
 */
function* get(id) {
  let scenarioValues;
  let scenario = {};
  if (id > 0) {
    scenario = yield Scenario.findById(id, {
      include: [includeParameterValueOption]
    });
    scenario = scenario.get({ plain: true });
    if (_.isNil(scenario)) {
      throw new errors.NotFoundError('The scenario not found for given id');
    }
    scenarioValues = scenario.parameters;
  } else {
    // get default
    scenario.isAutomate = true;
    scenarioValues = jsonfile.readJsonSync('data/defaultParameterValues.json');
  }

  const configurations = _.cloneDeep(parameters);
  configurations.strategic = _.map(configurations.strategic, (item) => {
    item.value = _.chain(scenarioValues).find({ parameterIndex: item.parameterIndex }).get('value').value() || 0;
    return item;
  });
  configurations.operational.costs = _.map(configurations.operational.costs, (item) => {
    item.value = _.chain(scenarioValues).find({ parameterIndex: item.parameterIndex }).get('value').value() || 0;
    return item;
  });
  configurations.operational.rates = _.map(configurations.operational.rates, (item) => {
    item.value = _.chain(scenarioValues).find({ parameterIndex: item.parameterIndex }).get('value').value() || 0;
    return item;
  });
  configurations.tactical = _.map(configurations.tactical, (item) => {
    item.value = _.chain(scenarioValues).find({ parameterIndex: item.parameterIndex }).get('value').value() || 0;
    return item;
  });
  scenario.parameters = configurations;
  return scenario;
}

get.schema = {
  id: Joi.number().integer().min(0).required()// 0 for default parameters
};

/**
 * mock service to delete scenario
 */
function* remove(id) {
  const entity = yield helper.ensureExist(Scenario, id, true);
  yield entity.destroy();
}

remove.schema = get.schema;

/**
 * mock service to update scenario
 */
function* update(id, payload) {
  const entity = yield Scenario.findById(id, {
    include: [includeParameterValueOption]
  });
  if (_.isNil(entity)) {
    throw new errors.NotFoundError('The scenario not found for given id');
  }
  payload.id = entity.id;
  yield Promise.all(entity.parameters.map(parameterValue => parameterValue.updateAttributes({ value: _.find(payload.parameters, ['parameterIndex', parameterValue.parameterIndex]).value })));
  yield entity.update(payload);
  return yield get(entity.id);
}

update.schema = {
  id: Joi.id(),
  payload: scenarioSchema
};

/**
 * service to share scenario
 */
function* share(data) {
  let mailOptions = {
    to: data.email, // list of receivers
    subject: 'Automotive report', // Subject line
    text: 'See the attached document', // plain text body
    attachments:[
      {   // binary buffer as an attachment
            filename: data.fileName,
            content: Buffer.from(data.doc, 'base64')
        },
    ]
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      logger.debug('Message %s sent: %s', info.messageId, info.response);
  });
  return {};
}

module.exports = {
  getAll,
  create,
  get,
  remove,
  update,
  share
};

logger.buildService(module.exports);
