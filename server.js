
/**
 * Claude Express Server
 * Please for the love of god refactor!!
 */

var
  express     = require('express')
, fs          = require('fs')
, spawn       = require('child_process').spawn
, path        = require('path')
, hbs         = require('hbs')
, request     = require('request')
, suppose     = require('suppose')
, Monitor     = require('forever-monitor').Monitor

, config      = require('./config')
, utils       = require('./lib/utils')
, errors      = require('./errors')
, m           = require('./middleware')

, app         = express()

, fields = {
    apps: ['name', 'subdomain', 'repo', 'description', 'active']
  }

, processes = {}

, data

, cloneRepo = function(user, server, callback){
  console.log('cloning', server.repo, 'into', config.appDir + '/' + server.name)
    var git = suppose('git', ['clone', server.repo.replace('https://', 'https://' + user.accessToken + '@'), config.appDir + '/' + server.name]);

    git.on('Username: ').respond(config.accessToken);
    git.on('Password: ').respond("");

    git.error(function(error){
      console.log(error);
      callback && callback(error);
    });

    git.end(callback);
  }

, removeServerDir = function(server, callback){
    utils.rmdirRecursive(config.appDir + '/' + server.name, callback);
  }

, removeServerDirSync = function(server, callback){
    utils.rmdirSyncRecursive(config.appDir + '/' + server.name, callback);
  }

, startServer = function(server, callback){
    // Figure out the entry point
    fs.readFile(config.appDir + '/' + server.name + '/package.json', function(error, pkg){
      if (error) return callback(error);

      pkg = JSON.parse(pkg);

      var file = pkg.main;

      if (!file) return callback(new Error('No main property'));

      if (file.indexOf('./')) file = file.replace('./', '');

      file = config.appDir + '/' + server.name + '/' + file;

console.log(file);
      processes[server.name] = new Monitor(file, { max: 1 });

      processes[server.name].start();

      callback();
    });
  }

, startServerSync = function(server){
    // Figure out the entry point
    var pkg = require(config.appDir + '/' + server.name + '/package.json')

    processes[server.name] = new Monitor(
      pkg.main.replace('./', '') + config.appDir + '/' + server.name + '/' + pkg.main
    );

    processes[server.name].start();
  }

, restartNginx = function(callback){
  console.log(config.nginx.restartFileName);
    var service = suppose('sudo', config.nginx.restart.split(' '));

    service.error(function(error){
      console.log(error);
      callback && callback(error);
    });

    service.end(callback);
  }

, restartNginxIfApplicable = function(server, callback){
    fs.exists(config.appDir + '/' + server.name + '/' + config.nginx.serverFileName, function(exists){
      if (!exists) return callback();

      restartNginxIfApplicable(callback);
    });
  }

, updateServer = utils.stage({
    start: function(user, server, updates, next, done){
      // Update data file
      data.set(updates.name, updates, function(error){
        if (error) done(errors.server.INTERNAL_SERVER_ERROR);

        // Shutting down server
        if (updates.active == false && processes[server.name])
          next('shutDownServer', user, server);

         // Starting server
        else if (updates.active == true)
          next('ensureServerExists', user, server);

        // Regular-ass update - no starting/stopping
        else done();
      });
    }

  , shutDownServer: function(user, server, next, done){
      processes[server.name].on('exit', function(code){
        if (!server.nginx) return done();

        restartNginxIfApplicable(function(error){
          if (error) return done(errors.server.INTERNAL_SERVER_ERROR);

          done();
        });
      });

      processes[server.name].on('error', function(){
        done(errors.server.INTERNAL_SERVER_ERROR);
      });

      processes[server.name].stop();
    }

  , ensureServerExists: function(user, server, next, done){
    console.log(', ensureServerExists');
    console.log(config.appDir + '/' + server.name + '/package.json');
      // Ensure that the server has been downloaded
      fs.exists(config.appDir + '/' + server.name + '/package.json', function(exists){

        // Woot, we don't need to download
        if (exists) return next('startServer', user, server);

        // Is it just the package json that doesn't exist?
        fs.exists(config.appDir + '/' + server.name, function(exists){

          if (!exists) done(errors.validation.INVALID_PACKAGE);

          // Download repo
          next('cloneRepo', user, server);
        });

      });
    }

  , cloneRepo: function(user, server, next, done){
    console.log(', cloneRepo');
      cloneRepo(user, server, function(error){
        if (error) return done(errors.server.INTERNAL_SERVER_ERROR);

        // Make sure nginx knows about any new server docs
        restartNginx(function(error){
          if (error) return done(errors.server.INTERNAL_SERVER_ERROR);

          next('installDependencies', user, server);
        });
      });
    }

  , installDependencies: function(user, server, next, done){
      var npm = spawn('npm', ['--prefix', config.appDir + '/' + server.name, 'install', config.appDir + '/' + server.name])

      npm.on('error', function(error){
        console.log(error);
        done(error)
      });

      npm.on('data', function(msg){
        console.log(msg);
      });

      npm.on('close', function(){
        next('startServer', user, server);
      });

    }

  , startServer: function(user, server, next, done){
    console.log(', startServer');
      startServer(server, function(error){
        if (error) done(errors.server.INTERNAL_SERVER_ERROR);

        done();
      });
    }
  })
;

app.init = function(options){
  // Get user configuration
  utils.deepExtend(config, options);

  // If ./ in restartFilePath, replace with full
  if (config.nginx.restartFileName.indexOf('./') == 0)
    config.nginx.restartFileName = config.nginx.restartFileName.replace('./', process.cwd() + '/');

  // Ensure Nginx is configured
  var configFile = fs.readFileSync(config.nginx.configFile).toString();

  // Nginx isn't configured properly
  if (configFile.indexOf('include ' + config.appDir + '/*/' + config.nginx.serverFileName) == -1){

    // Write include statement after default include
    configFile = configFile.replace(
      config.nginx.includeDetection
    , config.nginx.includeDetection
      + '\n' + config.nginx.tab + 'include '
      + config.appDir + '/*/' + config.nginx.serverFileName + ';'
    );

    fs.writeFileSync(config.nginx.configFile, configFile);
  }

  // Write restart-nginx script
  fs.writeFileSync(config.nginx.restartFileName, '#! /bin/bash\n\n' + config.nginx.restart);

  // Ensure data file exists
  if (!fs.existsSync(config.dataPath)){
    fs.writeFileSync(config.dataPath, 'module.exports = [];');
  }

  data = require(config.dataPath);

  data.has = function(name){
    for (var i = 0, l = data.length; i < l; ++i){
      if (data[i].name == name) return true;
    }
    return false;
  };

  data.get = function(name){
    for (var i = 0, l = data.length; i < l; ++i){
      if (data[i].name == name) return data[i];
    }
    return null;
  };

  data.set = function(name, props, callback){
    for (var i = 0, l = data.length; i < l; ++i){
      if (data[i].name == name){
        for (var key in props){
          if (fields.apps.indexOf(key) > -1) data[i][key] = props[key];
        }
        break;
      }
    }

    fs['writeFile' + (callback ? '' : 'Sync')](
      config.dataPath
    , 'module.exports = ' + JSON.stringify(data, '  ', true)
    , callback
    );

    return null;
  };

  data.create = function(props, callback){
    data.push(props);

    fs.writeFile(
      config.dataPath
    , 'module.exports = ' + JSON.stringify(data, '  ', true)
    , callback
    );
  };

  // Now start the servers
  for (var i = 0, l = data.length; i < l; ++i){
    if (data[i].active) startServerSync(data[i]);
  }

  // Setup express app
  app.configure(function(){
    app.set('port', process.env.PORT || config.port);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'hbs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('TODO: Replace cookie parser'));
    app.use(express.cookieSession());
    app.use(m.error);

    app.use(app.router);
  });

  app.configure('development', function(){
    app.use(express.errorHandler());
  });

  // app.get('/', routes.index);

  app.post('/oauth', function(req, res){
    var options = {
      url: config.github.accessTokenUrl + utils.queryParams({
        code:           req.body.code
      , client_id:      config.github.clientId
      , client_secret:  config.github.clientSecret
      })

    , method: 'POST'

    , json: true
    };

    request(options, function(error, response, body){
      console.log(body);
      if (error)
        return res.error(errors.auth.UNKNOWN_OAUTH);

      if (!body.access_token)
        return res.error(errors.auth.UNKNOWN_OAUTH);

      var url = config.github.userProfileUrl + '?access_token=' + body.accessToken;
      var accessToken = body.accessToken;

      // Get user profile
      request.get(url, function(error, response, body){
        if (error) return res.error(errors.auth.INVALID_ACCESS_TOKEN);

        body = JSON.parse(body);

        if (body.login != config.github.username) return res.error(errors.auth.INVALID_ACCESS_TOKEN);

        req.session.user = body;
        req.session.user.accessToken = accessToken;

        res.json(body);
      });
    });
  });

  app.get('/oauth', function(req, res){
    res.json({
      url: config.github.oauthUrl
        + '?client_id='
        + config.github.clientId
        + '&scope='
        + config.github.scopes.join(',')
    });
  });

  app.post('/session', function(req, res){
    if (!req.body.accessToken) return res.error(errors.auth.INVALID_ACCESS_TOKEN);

    var url = config.github.userProfileUrl + '?access_token=' + req.body.accessToken;

    // Ensure Access token belongs to server owner
    request.get(url, function(error, response, body){
      if (error) return res.error(errors.auth.INVALID_ACCESS_TOKEN);

        body = JSON.parse(body);
        console.log(body.login, config.github.username);

        if (body.login != config.github.username) return res.error(errors.auth.INVALID_ACCESS_TOKEN);

        req.session.user = body;
        req.session.user.accessToken = req.body.accessToken;

        res.json(body);
    });
  });

  app.get('/session', function(req, res){
    res.json(req.session.user);
  });

  app.del('/session', function(req, res){
    delete req.session.user;
    res.status(204).send();
  });

  app.get('/apps', m.auth, function(req, res){
    res.send(data);
  });

  app.post('/apps', m.auth, function(req, res){
    if (data.has(req.body.name)) return res.error(errors.validation.APP_NAME_TAKEN);

    req.body.active = false;

    if (!req.body.subdomain && req.body.subdomain != '') req.body.subdomain = req.body.name;

    data.create(req.body, function(error){
      if (error) return res.status(500).send();

      res.status(204).send();
    });
  });

  app.put('/apps/:name', m.auth, function(req, res){
    if (!data.has(req.param('name'))) return res.status(404).send();

    updateServer(req.session.user, data.get(req.param('name')), req.body, function(error){
      if (error) return res.error(error);

      res.status(204).send();
    });
  });

  app.post('/apps/:name/deploy', m.auth, function(req, res){
    if (!data.has(req.param('name'))) return res.status(404).send();

    var server = data.get(req.param('name'));

    // Turn off server if active
    updateServer(req.session.user, server, { active: false }, function(error){
      if (error) return res.error(errors.server.INTERNAL_SERVER_ERROR);

      // Remove current server directory
      removeServerDir(server, function(error){
        if (error) return res.error(errors.server.INTERNAL_SERVER_ERROR);

        // Re-activate server
        updateServer(req.session.user, server, { active: true }, function(error){
          if (error) return res.error(errors.server.INTERNAL_SERVER_ERROR);

          res.status(204).send();
        });
      });
    });
  });
};

module.exports = app;