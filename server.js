
/**
 * Module dependencies.
 */

var
  express     = require('express')
, fs          = require('fs')
, spawn       = require('child_process').spawn
, http        = require('http')
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
    apps: ['name', 'repo', 'description', 'active']
  }

, processes = {}

, data

, cloneRepo = function(server, callback){
    var git = suppose('git', ['clone', server.repo, app.get('appDir') + '/' + server.name]);

    git.on('Username: ').respond(app.get('accessToken'));
    git.on('Password: ').respond("");

    git.error(function(error){
      callback && callback(error);
    });

    git.end(callback);
  }

, startServer = function(server, callback){
    // Figure out the entry point
    fs.readFile(app.get('appDir') + '/' + server.name + '/package.json', function(error, pkg){
      if (error) return callback(error);

      pkg = JSON.parse(pkg);

      processes[server.name] = new Monitor(
        pkg.main.replace('./', app.get('appDir') + '/' + server.name + '/')
      );

      processes[server.name].start();

      callback();
    });
  }

, updateServer = utils.stage({
    start: function(server, updates, next, done){
      // Update data file
      data.set(req.param('name'), updates, function(error){
        if (error) done(errors.server.INTERNAL_SERVER_ERROR);

        // Shutting down server
        if (updates == false && processes[server.name])
          next('shutDownServer', server);

         // Starting server
        else if (req.body.active == true)
          next('startServer', server);

        // Regular-ass update - no starting/stopping
        else done();
      });
    }

  , shutDownServer: function(server, next, done){
      processes[server.name].on('exit', function(){
        done();
      });

      processes[server.name].on('error', function(){
        done(errors.server.INTERNAL_SERVER_ERROR);
      });

      processes[server.name].exit();
    }

  , ensureServerExists: function(server, next, done){
      // Ensure that the server has been downloaded
      fs.exists(app.get('appDir') + '/' + server.name + '/package.json', function(error, exists){
        if (error) return done(errors.server.INTERNAL_SERVER_ERROR);

        // Woot, we don't need to download
        if (exists) next('startServer', server);

        // Unforkunately, we've got to download this damn repo
        else next('cloneRepo', server);
    }

  , cloneRepo: function(server, next, done){
      cloneRepo(server, function(error){
        if (error) return done(errors.server.INTERNAL_SERVER_ERROR);

        next('installDependencies', server);
      });
    }

  , installDependencies: function(server, next, done){
      // TODO
      next('startServer', server);
    }

  , startServer: function(server, next, done){
      startServer(server, function(error){
        if (error) done(errors.server.INTERNAL_SERVER_ERROR);

        done();
      });
    }
  })
;

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
    'module.exports = ' + JSON.stringify(data, '  ', true)
  , callback
  );

  return null;
};

// When server starts, everything is inactive
for (var i = 0, l = data.length; i < l; ++i){
  data[i].active = false;
}

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.cookieParser('TODO: Replace cookie parser'));
  app.use(m.error);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

app.get('/oauth-callback', function(req, res){
  var options = {
    url: config.githubAccessTokenUrl

  , method: 'POST'

  , json: true

  , body: {
      code:         req.param('code')
    , clientId:     app.get('clientId')
    , clientSecret: app.get('clientSecret')
    }
  };

  request(options, function(error, response, body){
    if (error)
      return res.render('oauth-complete', { error: errors.auth.UNKNOWN_OAUTH });

    if (!body.access_token)
      return res.render('oauth-complete', { error: errors.auth.UNKNOWN_OAUTH });

    res.render('oauth-complete', { accessToken: body.access_token });
  });
});

app.get('/oauth', function(req, res){
  res.redirect(
    config.githubOuathUrl
  + '?client_id=' + app.get('clientId')
  );
});

app.post('/session', function(req, res){
  if (!req.body.accessToken) return res.error(errors.auth.INVALID_ACCESS_TOKEN);

  var url = config.githubUserUrl + '?access_token=' + req.body.accessToken;

  // Ensure Access token belongs to server owner
  request.get(url, function(error, response, body){
    if (error) return res.error(errors.auth.INVALID_ACCESS_TOKEN);

    if (body.login != app.get('githubUserName')) return res.error(errors.auth.INVALID_ACCESS_TOKEN);

    app.set('accessToken', req.body.accessToken);

    req.session.user = body;

    res.json(body);
  });
});

app.get('/session', function(req, res){
  res.json(req.session.user);
});

app.get('/apps', auth, function(req, res){
  res.send(data);
});

app.post('/apps', auth, function(req, res){
  if (data.has(req.param('name'))) return res.error(errors.validation.APP_NAME_TAKEN);

  req.body.active = false;

  data.set(req.param('name'), req.body, function(error){
    if (error) return res.status(500).send();

    res.status(204).send();
  });
});

app.put('/apps/:name', auth, function(req, res){
  if (!data.has(req.param('name'))) return res.status(404).send();

  updateServer(data.get(req.param('name')), req.body, function(error){
    if (error) return res.error(error);

    res.status(204).send();
  });
});

app.post('/apps/:name/pull' auth, function(req, res){
  // Pull latest form github
});

module.exports = app;