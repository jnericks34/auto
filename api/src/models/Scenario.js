'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Schema for scenario
 * @author TCSCODER
 * @version 1.0
 */
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const model = sequelize.define('Scenario',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(50), allowNull: false },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      isAutomate: { type: Sequelize.BOOLEAN, allowNull: false }
    },
    {
      tableName: 'Scenario',
      timestamps: false
    }
  );
  model.modelName = 'Scenario';
  return model;
};
