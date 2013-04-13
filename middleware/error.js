/**
 * Error
 */

module.exports = function(req, res, next){
  res.error = function(error){
    res.status(error.httpCode);
    res.send(error);
  };
};