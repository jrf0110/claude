/**
 * Error
 */

module.exports = function(req, res, next){
  res.error = function(error){
    res.status(parseInt(error.httpCode));
    res.send(error);
  };
  next();
};