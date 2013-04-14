# Claude.js - An App Manager for Servers

Claude Shannon was an American mathematician, electronic engineer, and cryptographer known as "The father of information theory". Claude.js is a deployment server for node.js apps. It allows you to very easily deploy your apps to a VPS.

```npm install claude```

For an example app deployed with claude, check out my [contact card](https://github.com/jrf0110/contact)

Claude assumes you're setting up individual node.js apps at your domain like:

```
http://app1.yourdomain.com
http://app2.yourdomain.com
http://app3.yourdomain.com
```

Anything that matches your node.js http server should go there, otherwise, we should assume it's a static resource to be handled by nginx.

You create a claude server like this:

```javascript
var claude = require('claude');

claude.init({
  // You need to setup a github app that claude will use for oauth
  github: {
    clientId:             process.env.GITHUB_CLIENT_ID
  , clientSecret:         process.env.GITHUB_CLIENT_SECRET

    // Specify the github username that you want to allow to control your apps
  , username:             'jrf0110'
  }

  // Directory you want your apps to be stored in
, appDir:                 '/apps'

  // Where to hold data that claude needs
, dataPath:               process.cwd() + '/data.js'

  // What port should claude run on?
, port:                   3003
});
```

You can look at my claude server [here](https://github.com/jrf0110/apps-server).

Claude uses Nginx for static resources and virtual host setup. It's not necessary to include one. Claude will still host your app on whatever port you want, but you're on your own as far as sub-domains are concerned. Your nginx file should look something like this:

```
 server {
  server_name apps1.mydomain.com;
  listen 80;

  root /apps/app1.mydomain.com/public;
  index index.html index.htm;

  location ~ ^/(.*\..*)$ {
    alias /apps/app1.mydomain.com/public/$1;
  }

  location ~ ^/(.+)$ {
    # root /apps/app1.mydomain.com/public;
    proxy_pass http://127.0.0.1:3003;
  }
}
```

## Deploying an app

So, I haven't built a client for this yet, but you can do everything over http right now.

__Authorize Github__

Get the github oauth url

```
GET /oauth - Gets the url to authorize the app
```

Give claude the code that github gave you

```
POST /oauth { code: github_code }
```

Now you should be authenticated. If there was an error, check the output from the server. I probably messed something up int he oauth proess. There should be some output that says access_token: 'SOME_ACCESS_TOKEN_TEXT'. Copy the token, and then:

```
POST /session { accessToken: github_access_token }
```

Once claude gets an access token, it ensures your identity by checking your github user profile. Authing is the worst part. It's buggy, but will be fixed. Thankfully, you don't have to login all the time.

__Adding an App__

To add an app:

```
POST /apps { name: 'app1', repo: 'https://github.com/username/app1.git' }
```

NOTE: Be sure and use the http repo url and not the ssh!

Adding an app only adds it to the app database. You can turn apps on and off and by default they're off. Activate an app by:

```
PUT /apps/:name { active: true }
```

If it's the first time to be activated, then the repo will be pulled down, dependencies will be installed, nginx will be restarted if necessary, and the app will start.

__Re-Deploying an App__

To re-deploy an app:

```
POST /apps/:name/deploy
```

So, this will force the app to re-download from the origin, dependencies installed, nginx will be restarted if necessary, and the app will start.

### Permissions problems

Whatever app directory you specify, obviously the user that starts your claude server needs have to read/write permissions on it. Also, nginx typically requires root access to start and stop. For that reason, claude generates a bash script that contains the command to restart nginx. You can specify your own comand from the ```nginx.restart``` property. By default, it will be setup for ubuntu:

```
service nginx restart
```

In order to get around the sudo problem, claude needs an exception made in the ```/etc/sudoers``` file:

```
username ALL=NOPASSWD: /path/to/claude/server/restart-nginx
```

## In the year 2000

Plans to implement very soon:

* A complete re-factor because this was quickly hacked together
* Claude CLI - ```claude deploy, claude stop, etc```
* An HTML client
* Claude Apps (like heroku)

For the apps, I'm thinking something like this in your ```package.json```

```javascript
...
"claude": {
  "postgres": "9.0.2",
  "nodetime": "*"
}
...
```
