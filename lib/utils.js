var
  utils = module.exports = {}
;

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

  return current;
};