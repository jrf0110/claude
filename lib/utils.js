var
  utils       = module.exports = {}

, deepExtend  = require('deep-extend')
, wrench      = require('wrench')
;

for (var key in wrench) utils[key] = wrench[key];

utils.deepExtend = deepExtend;

utils.stage = function(fns){
  var current = function(){
    var args = Array.prototype.slice.call(arguments, 0);
    var callback = args.pop();

    // Redefine current after first call so that it doesn't default to 'start'
    current = function(name){
      if (!fns.hasOwnProperty(name)) throw new Error('Cannot find stage item: ', name);
      fns[name].apply(null, Array.prototype.slice.call(arguments, 1).concat(current, callback));
    };

    fns.start.apply(null, args.concat(current, callback));
  };

  // Make each function available to call through main function
  // for (var key in fns){
  //   current[key] = function(){
  //     var args = Array.prototype.slice.call(arguments, 0);
  //     var callback = args.pop();

  //     fns[key].apply(null, )
  //   };
  // }

  return current;
};

utils.queryParams = function(data){
  if (typeof data !== "object") return "";
  var params = "?";
  for (var key in data){
    params += key + "=" + data[key] + "&";
  }
  return params.substring(0, params.length - 1);
};