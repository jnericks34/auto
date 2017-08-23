'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * App bootstrap
 * @author TCSCODER
 * @version 1.0
 */

global.Promise = require('bluebird');
const fs = require('fs');
const config = require('config');
const Joi = require('joi');

Joi.id = () => Joi.number().integer().min(1).required();

// give execution permission to binary file
fs.chmodSync(config.PATHS.AutomateYes, 755);
fs.chmodSync(config.PATHS.AutomateNo, 755);

