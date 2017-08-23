# BERMUDA - AUTOMOTIVE MANUFACTURING
Deployment Guide

## Prerequisites
- Docker https://docs.docker.com/engine/installation/ 
- Docker Compose  https://docs.docker.com/compose/install/
- heroku cli
- node js

## Configuration
Open the `api/config/default.js` and configure per your environment need
- `LOG_LEVEL`: The log level
- `PORT`: The port to listen
- `API_VERSION`: The version of api
- `PATHS.AutomateYes`: The path of file for `BermudaAutomate_Yes_v1.1`
- `PATHS.AutomateNo`: The path of file for `BermudaAutomate_No_v1.1`
- `SENSITIVITY_POINTS_PERCENTAGE`: The array of percentage interval for different sensitivity parameter value
- `SENSITIVITY_DATA_POINT_TIME_VALUE`: The time value which will be used for sensitivity value
- `DATABASE_URL`: The posgtres database url
- `SMTP_HOST`: The smtp server url
- `SMTP_USERNAME`: The smtp username
- `SMTP_PASSWORD`: The smtp password

  > Default path is configured to be `exe/*`. So keep files under that folder

List of parameters (operational tactical, strategic) and their ranges are configured in `api/data/parameters.json`.

Default values for parameters is configured in `api/data/defaultParameterValues.json`.


## Local deployment with docker
Open the terminal to root folder and run below commands
```
sudo docker-compose up 

```
App should be ready to use on http://localhost:8080


## Deployment to Heroku
Open the terminal to root folder and follow following steps

1. Create app in heroku for both app and api
```
cd api && heroku create bermuda-api --remote heroku-api
cd app && heroku create bermuda-app --remote heroku-app
```
2. Go to `api` folder and run
```
 heroku addons:create heroku-postgresql --remote heroku-api
```
This will create Postgres database and set `DATABASE_URL` ready to use by api. For more detail see [here](https://devcenter.heroku.com/articles/heroku-postgresql)
```
heroku container:push web --remote heroku-api
```
>This will deploy the API in heroku.

3. Get the web URL of API using below 
```
heroku apps:info --remote heroku-api
```
4. Update the baseUrl of API in frontend in `app/js/Api.js` with url from step 3.
5. Go to `app` folder and run
```
heroku container:push web --remote heroku-app
```
6. Get the web URL for web using 
```
heroku apps:info --remote heroku-app
```

Browse the application using the URL from 6.




