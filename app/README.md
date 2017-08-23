## Installation
Install all dependencies

``` sh
$ npm install
```

## Configurations

Open `js/Api.js` and set the base API URL 
- `baseUrl`

## Build
You need to have npm and sass in order to build the project.

Build css with:
``` sh
$ npm run sass
```

## Run it
Run `npm start`

Access the url in your browser (http://localhost:8080/).


## CSS validation errors
As stated in the contest description, there are allowed some basic validation fails.
The `pointer-events` and will fail because it isn't in css3's spec but it does have full browser support and is widely used by all major css frameworks.
The other css warnings can be ignored since they're fully supported and it's just a vendor validation problem.

## JSON data
You can find the json data in the `/data` folder.



