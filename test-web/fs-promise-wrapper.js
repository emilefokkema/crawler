var fs = require('fs');

var promisify = function(f){
	return function(){
		var resolve, reject;
		var promise = new Promise(function(res, rej){resolve = res; reject = rej;});
		var args = Array.prototype.slice.apply(arguments);
		f.apply(null, args.concat([function(err, data){
			if(err){
				reject(err)
			}else{
				resolve(data);
			}
		}]));
		return promise;
	};
};

var readFile = promisify(fs.readFile.bind(fs));
var writeFile = promisify(fs.writeFile.bind(fs));

module.exports = {readFile: readFile, writeFile: writeFile};