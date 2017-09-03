var static = require('node-static');
var file = new static.Server();
console.log("Serving on Port 8080");
require('http').createServer(function(request, response) {
  request.addListener('end', function() {
    file.serve(request, response);
  }).resume();
}).listen(process.env.PORT || 8080);
