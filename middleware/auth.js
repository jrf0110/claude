/**
 * Auth
 */

var
  errors = require('../errors')
;

module.exports = function(req, res, next){
  if (!req.session || !req.session.user)
    return res.error(errors.auth.NOT_AUTHENTICATED);
  
  next();
};