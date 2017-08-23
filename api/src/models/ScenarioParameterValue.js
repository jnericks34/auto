'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Schema for scenario parameter value
 * @author TCSCODER
 * @version 1.0
 */
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const model = sequelize.define('ScenarioParameterValue',
    {
      parameterIndex: { type: Sequelize.INTEGER, allowNull: false },
      value: { type: Sequelize.FLOAT, allowNull: false },
      scenarioId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: 'ScenarioParameterValue',
      timestamps: false,
      indexes: [
        {
          name: 'parameter_per_scenario',
          fields: ['parameterIndex', 'scenarioId'],
          unique: true
        },
        {
          unique: false,
          fields: ['scenarioId']
        }]
    }
  );
  model.modelName = 'ScenarioParameterValue';
  return model;
};
