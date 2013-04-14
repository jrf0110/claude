// Please note, everything I've written for this has been
// a quick and dirty hack. Maybe I'll refine everything later

var http        = require('http');

module.exports.init = function(options){
  if (!options.github.clientId)       throw new Error('Field `github.clientId` required.');
  if (!options.github.clientSecret)   throw new Error('Field `github.clientSecret` required.');
  if (!options.github.username)       throw new Error('Field `github.username` required.');
  if (!options.appDir)                throw new Error('Field `appDir` required.');

  var server = require('./server');

  server.init(options);

  // Start server
  http.createServer(server).listen(server.get('port'), function(){
    console.log("Express server listening on port " + server.get('port'));
  });
};