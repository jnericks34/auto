# BERMUDA - AUTOMOTIVE MANUFACTURING
Deployment Guide

# Install Docker

Install dependencies with 
`sudo yum install -y yum-utils device-mapper-persistent-data lvm2`

Add docker repository
`sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo`

Update yum cache
`sudo yum makecache fast`

Install docker
`sudo yum install docker-ce`

Start the docker deamon
`sudo systemctl start docker`

# Install docker-compose

`sudo yum install epel-release`

`sudo yum install -y python-pip`

`sudo pip install docker-compose`

`sudo yum upgrade python*`

## Docker configuration
In the docker-compose.yml file you can configure these parameters:
	SMTP_HOST: 'smtp.gmail.com' (The smtp server url that will be used to send emails)
    SMTP_USERNAME: 'username' (The smtp username)
    SMTP_PASSWORD: 'password' The smtp password)
    api port: 3000:3000 (change only the second number)
    app port: 8080:8080 (change only the second number
    API_URL: http://localhost:3000/v1 (replace localhost with hostname of the machine that is running the api, replace port with api port set above)

    Database configurations does not need to change, db is accessible only to the api container.

## Configuration
Open the `api/config/default.js` and configure per your environment need
- `PATHS.AutomateYes`: The path of file for `BermudaAutomate_Yes_v1.1` (executable should be placed in the exe directory)
- `PATHS.AutomateNo`: The path of file for `BermudaAutomate_No_v1.1` (executable should be placed in the exe directory)
- `DATABASE_URL`: The posgtres database url (no need to do anything if running with docker)
- `SMTP_HOST`: The smtp server url that will be used to send emails (no need to do anything if running with docker)
- `SMTP_USERNAME`: The smtp username (no need to do anything if running with docker)
- `SMTP_PASSWORD`: The smtp password (no need to do anything if running with docker)

These parameters don't need to be changed
- `SENSITIVITY_POINTS_PERCENTAGE`: The array of percentage interval for different sensitivity parameter value
- `SENSITIVITY_DATA_POINT_TIME_VALUE`: The time value which will be used for sensitivity value
- `LOG_LEVEL`: The log level
- `PORT`: The port to listen (no need to do anything if running with docker)
- `API_VERSION`: The version of api (no need to do anything if running with docker)

  > Default path is configured to be `exe/*`. So keep files under that folder

List of parameters (operational tactical, strategic) and their ranges are configured in `api/data/parameters.json`.

Default values for parameters is configured in `api/data/defaultParameterValues.json`.


## Local deployment with docker
Open the terminal to root folder and run below commands
```
sudo docker-compose up --build --force-recreate

```
App should be ready to use on http://localhost:8080

