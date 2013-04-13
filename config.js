module.exports = {
  github: {
    // Url for github oauth
    oauthUrl:       'https://github.com/login/oauth/authorize'

    // URL to exchange code for access token
  , accessTokenUrl: 'https://github.com/login/oauth/access_token'

    // URL to get user profile and ensure user is correct user
  , userProfileUrl: ''
  }

, nginx: {
    // Location of the servers nginx configuration file
    configFile: '/etc/nginx/nginx.conf'
    
    // Name of the file to look for in apps directory nginx
  , serverFileName: 'nginx'

    // String to search for to place inlcude statement after in config
  , includeDetection: 'include /etc/nginx/sites-enabled/*;'
  }

, dataPath: './data.js'

, port: 3000
};