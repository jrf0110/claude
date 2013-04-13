// Please note, everything I've written for this has been
// a quick and dirty hack. Maybe I'll refine everything later

module.exports.init = function(options){
  if (!options.clientId)        throw new Error('Field `clientId` required.');
  if (!options.clientSecret)    throw new Error('Field `clientSecret` required.');
  if (!options.githubUserName)  throw new Error('Field `githubUserName` required.');
  if (!options.appDir)          throw new Error('Field `appDir` required.');

  var server = require('./server');

  server.init(options);

  // Start server
  http.createServer(server).listen(server.get('port'), function(){
    console.log("Express server listening on port " + server.get('port'));
  });
};