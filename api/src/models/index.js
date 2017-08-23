'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Initialize and export all model schemas
 * @author TCSCODER
 * @version 1.0
 */
const config = require('config');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(config.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: config.DATABASE_SSL
  }
});

const Scenario = require('./Scenario')(sequelize);
const ScenarioParameterValue = require('./ScenarioParameterValue')(sequelize);

Scenario.hasMany(ScenarioParameterValue, { as: 'parameters', foreignKey: 'scenarioId', onDelete: 'cascade' });

module.exports = {
  Scenario,
  ScenarioParameterValue
};

module.exports.init = force => sequelize.sync({ force });
