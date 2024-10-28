//http module is required to create a server
var http = require("http");
var express = require("express");
var path = require("path");

var app = express();
app.use(express.static('public'));

//handles incoming http request
function requestHandler(request, response) {
  response.end("Hello, World!");
}


//app.get("/", function (request, response) {
  //response.send("Hello, World!");
//});

//create server that uses function to handle requests
var server = http.createServer(requestHandler);

//start server to listen to port 3000
//app.listen();
server.listen(3000);