// Please note, everything I've written for this has been
// a quick and dirty hack. Maybe I'll refine everything later

var
  fs     = require('fs')

, server = require('./server')
, config = require('./config')
;

module.exports.init = function(options){
  if (!options.clientId) throw new Error('Field `clientId` required.');
  if (!options.clientSecret) throw new Error('Field `clientSecret` required.');
  if (!options.githubUserName) throw new Error('Field `githubUserName` required.');

  server.set('clientId', options.clientId);
  server.set('clientSecret', options.clientSecret);
  server.set('githubUserName', options.githubUserName);

  // Start server
  http.createServer(server).listen(server.get('port'), function(){
    console.log("Express server listening on port " + server.get('port'));
  });
};