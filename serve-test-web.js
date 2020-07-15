var http = require('http');
var fs = require('fs');
var os = require('os');

(async function(){
	var active = true;
	var hostFilePath = '/Windows/System32/drivers/etc/hosts';
	var EOL = os.EOL;

	var writeError = function(res, message){
		res.writeHead(500);
		res.write(message);
		res.end();
	};

	var readFile = function(path){
		var resolve, reject;
		var promise = new Promise(function(res, rej){resolve = res; reject = rej;});
		fs.readFile(path, 'utf8', function(err, data){
			if(err){
				reject(err)
			}else{
				resolve(data);
			}
		});
		return promise;
	};

	var hosts = await readFile(hostFilePath);
	var newHostNames = ["foo", "bar"];
	
	
	
	//var match = hosts.match(/(?:(?:^|[\r\n])(?:\d+\.)*\d+\s+[^\s]+\s*)+/)
	//console.log(match);

	// var server = http.createServer(function (req, res) {
	// 	console.log(req.url)
	// 	if(!active){
	// 		return writeError(res, 'stopped');
	// 	}
	// 	if(req.url === "/stop"){
	// 		console.log(`stopping`)
	// 		active = false;
	// 		server.close();
	// 		res.write('stopped');
	// 		res.end();
	// 		return;
	// 	}
	// 	if(!('host' in req.headers)){
	// 		return writeError(res, `please make sure there is a 'host' header in the request`);
	// 	}
	// 	res.write("you visited " + req.headers.host + req.url);
	// 	res.end();
	// });
	// server.listen(8080);
	// console.log("listening on port 8080...");
})();
