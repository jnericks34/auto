const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('.'))

app.get('/apiUrl', function(req, res){
  res.send({'apiUrl':process.env.API_HOSTNAME,
			'apiPort':process.env.API_PORT});
});

app.listen(process.env.PORT || 8080);