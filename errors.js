var errors = module.exports = {};

/**
 * Authentication Errors
 */

errors.auth = {};

errors.auth.NOT_AUTHENTICATED = {
  type:     "auth"
, code:     "0001"
, httpCode: "401"
, name:     "NOT_AUTHENTICATED"
, message:  "You are not authenticated. Please Login."
};
errors[errors.auth.NOT_AUTHENTICATED.code] = errors.auth.NOT_AUTHENTICATED;

errors.auth.NOT_ALLOWED = {
  type:     "auth"
, code:     "0002"
, httpCode: "403"
, name:     "NOT_ALLOWED"
, message:  "You are not allowed to use this resource."
};
errors[errors.auth.NOT_ALLOWED.code] = errors.auth.NOT_ALLOWED;

errors.auth.INVALID_EMAIL = {
  type:     "auth"
, code:     "0003"
, httpCode: "401"
, name:     "INVALID_EMAIL"
, message:  "Invalid Email. Please try again."
};
errors[errors.auth.INVALID_EMAIL.code] = errors.auth.INVALID_EMAIL;

errors.auth.INVALID_PASSWORD = {
  type:     "auth"
, code:     "0004"
, httpCode: "401"
, name:     "INVALID_PASSWORD"
, message:  "Invalid Password. Please try again."
};
errors[errors.auth.INVALID_PASSWORD.code] = errors.auth.INVALID_PASSWORD;

errors.auth.UNKNOWN_OAUTH = {
  type:     "auth"
, code:     "0005"
, httpCode: "401"
, name:     "UNKNOWN_OAUTH"
, message:  "There was an unknown error in the oauth process."
};
errors[errors.auth.UNKNOWN_OAUTH.code] = errors.auth.UNKNOWN_OAUTH;

errors.auth.INVALID_ACCESS_TOKEN = {
  type:     "auth"
, code:     "0004"
, httpCode: "401"
, name:     "INVALID_ACCESS_TOKEN"
, message:  "Invalid Password. Please try again."
};
errors[errors.auth.INVALID_ACCESS_TOKEN.code] = errors.auth.INVALID_ACCESS_TOKEN;

errors.validation = {};

errors.validation.NO_VALID_FIELDS = {
  type:     "validation"
, code:     "0101"
, httpCode: "400"
, name:     "NO_VALID_FIELDS"
, message:  "This resource requires parameters on the query or body that we're not found."
};
errors[errors.validation.NO_VALID_FIELDS.code] = errors.validation.NO_VALID_FIELDS;

errors.validation.APP_NAME_TAKEN = {
  type:     "validation"
, code:     "0102"
, httpCode: "400"
, name:     "APP_NAME_TAKEN"
, message:  "The name provided for this app has already been taken"
};
errors[errors.validation.APP_NAME_TAKEN.code] = errors.validation.APP_NAME_TAKEN;

errors.validation.INVALID_PACKAGE = {
  type:     "validation"
, code:     "0103"
, httpCode: "400"
, name:     "INVALID_PACKAGE"
, message:  "Missing or malformed package.json"
};
errors[errors.validation.INVALID_PACKAGE.code] = errors.validation.INVALID_PACKAGE;

errors.server = {};

errors.server.INTERNAL_SERVER_ERROR = {
  type:     "server"
, code:     "0200"
, httpCode: "500"
, name:     "INTERNAL_SERVER_ERROR"
, message:  "The name provided for this app has already been taken"
};
errors[errors.server.INTERNAL_SERVER_ERROR.code] = errors.server.INTERNAL_SERVER_ERROR;