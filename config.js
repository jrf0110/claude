module.exports = {
  github: {
    // Url for github oauth
    oauthUrl:       'https://github.com/login/oauth/authorize'

    // URL to exchange code for access token
  , accessTokenUrl: 'https://github.com/login/oauth/access_token'

    // URL to get user profile and ensure user is correct user
  , userProfileUrl: 'https://api.github.com/user'

    // What we need from the user
  , scopes: ['user', 'repo']
  }

, nginx: {
    // Location of the servers nginx configuration file
    configFile: '/etc/nginx/nginx.conf'
    
    // Name of the file to look for in apps directory nginx
  , serverFileName: 'nginx'

    // String to search for to place inlcude statement after in config
  , includeDetection: 'include /etc/nginx/sites-enabled/*;'

    // String to use for a tab in nginx config file
  , tab: '\t'

    // How to restart nginx
  , restart: '/etc/init.d/nginx restart'
  }

, dataPath: './data.js'

, port: 3000
};