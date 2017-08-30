'use strict';

/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * The configuration file
 * @author TCSCODER
 * @version 1.0
 */

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,
  API_VERSION: process.env.API_VERSION || 1,
  CORS_OPTIONS: {
    origin: '*'
  },
  PATHS: {
    AutomateYes: 'exe/BermudaAutomate_Yes_v1.1',
    AutomateNo: 'exe/BermudaAutomate_No_v1.1'
  },
  SENSITIVITY_POINTS_PERCENTAGE: process.env.SENSITIVITY_POINTS_PERCENTAGE || [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], // use value as 10% interval
  SENSITIVITY_DATA_POINT_TIME_VALUE: process.env.SENSITIVITY_DATA_POINT_TIME_VALUE || 1000, // get value of 1000 days
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/bermudadb?ssl=false',
  DATABASE_SSL: 0==process.env.DATABASE_SSL?false: true,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_USERNAME: process.env.SMTP_USERNAME || 'test_account',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || 'test_password',
  TOP_N_PARAM: 5
};
