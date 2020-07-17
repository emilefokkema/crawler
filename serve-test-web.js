var http = require('http');
var fs = require('fs');
var os = require('os');

(async function(){
	var active = true;
	var hostFilePath = '/Windows/System32/drivers/etc/hosts';
	var hostNameSuffix = `.crawlable.web`;
	var localHostIP = `127.0.0.1`;
	var testWebJsonPath = `test-web.json`;
	var robotsTxtPath = '/robots.txt';
	var portNumber = 8080;
	var stopPath = '/stop';
	var EOL = os.EOL;

	var escapeRegex = function(string) {
	    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	var writeError = function(res, message){
		res.writeHead(500);
		res.write(message);
		res.end();
	};

	var writeNotFound = function(res){
		res.writeHead(404);
		res.write('the requested resource was not found');
		res.end();
	};

	class Link{
		constructor(definition){
			this.domain = definition.domain;
			this.path = definition.path;
			this.title = definition.title;
		}
		domainExists(testWeb){
			return testWeb.domainExists(this.domain);
		}
		createHtml(testWeb){
			var href = testWeb.getAddressForDomainAndPath(this.domain, this.path);
			return `<a href="${href}">${this.title}</a>`;
		}
	}

	class Robots{
		constructor(content){
			this.content = content;
		}
		handle(req, res){
			res.writeHead(200, {
				'Content-Type': 'text/plain; charset=UTF-8'
			});
			res.write(this.content);
			res.end();
		}
	}

	class Page{
		constructor(definition){
			this.path = definition.path;
			this.links = definition.links.map(function(l){return new Link(l);});
			this.html = undefined;
		}
		getAddress(domain){
			return domain.getAddressForPath(this.path);
		}
		getHtml(testWeb){
			return this.html || (this.html = this.createHtml(testWeb));
		}
		createHtml(testWeb){
			var self = this;
			this.links = this.links.filter(function(l){return l.domainExists(testWeb);});
			return `<!DOCTYPE html>
			<html>
				<head>
					<title>title</title>
				</head>
				<body>
				<ul>
					${this.links.map(function(l){return `<li>${l.createHtml(testWeb)}</li>`}).join('')}
				</ul>
				<a href="${stopPath}">stop</a>
				</body>
			</html>`;
		}
		handle(req, res, testWeb){
			res.writeHead(200, {
				'Content-Type': 'text/html; charset=UTF-8'
			});
			res.write(this.getHtml(testWeb));
			res.end();
		}
	}

	class Domain{
		constructor(definition){
			this.name = definition.name;
			this.fullHostName = this.name + hostNameSuffix;
			this.hostNameAndPort = `${this.fullHostName}:${portNumber}`;
			this.pages = definition.pages.filter(function(p){return !definition.robots || p.path !== robotsTxtPath;}).map(function(p){return new Page(p);});
			if(definition.robots){
				this.robots = new Robots(definition.robots);
			}
		}
		getAddress(){
			return (this.pages.length === 0 && undefined) || this.pages[0].getAddress(this);
		}
		getAddressForPath(path){
			return `http://${this.hostNameAndPort}${path}`;
		}
		handle(req, res, testWeb){
			if(req.url === robotsTxtPath && this.robots){
				return this.robots.handle(req, res);
			}
			var page = this.pages.find(function(p){return p.path === req.url;});
			if(!page){
				return writeNotFound(res);
			}
			page.handle(req, res, testWeb);
		}
	}

	class TestWeb{
		constructor(definition){
			var self = this;
			this.domains = definition.domains.map(function(d){return new Domain(d);});
		}
		getAddress(){
			return (this.domains.length === 0 && undefined) || this.domains[0].getAddress();
		}
		domainExists(domainName){
			return this.domains.findIndex(function(d){return d.name === domainName;}) > -1;
		}
		getAddressForDomainAndPath(domainName, path){
			var domain = this.domains.find(function(d){return d.name === domainName;});
			return domain.getAddressForPath(path);
		}
		handle(req, res){
			if(!('host' in req.headers)){
				return writeError(res, `please make sure there is a 'host' header in the request`);
			}

			var domain = this.domains.find(function(d){return d.hostNameAndPort === req.headers.host;});
			if(!domain){
				return writeError(res, `cannot find domain ${req.headers.host}`);
			}
			domain.handle(req, res, this);
		}
	}

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

	var writeToHostsFile = async function(data){
		try{
			await writeFile(hostFilePath, data, 'utf8');
			return true;
		}catch(e){
			console.error(`could not write to hosts file. Are you running this script as administrator?`);
			return false;
		}
	};

	var hosts = await readFile(hostFilePath, 'utf8');

	var testWeb;

	var loadTestWeb = async function(){
		console.log(`reading test-web from ${testWebJsonPath}`);
		testWeb = new TestWeb(JSON.parse(await readFile(testWebJsonPath, 'utf8')));
	};

	await loadTestWeb();

	fs.watchFile(testWebJsonPath, loadTestWeb);

	var stop = async function(){
		if(!active){
			return;
		}
		console.log(`stopping`)
		active = false;
		fs.unwatchFile(testWebJsonPath, loadTestWeb);
		if(await writeToHostsFile(hosts)){
			console.log(`restored previous hosts file`);
		}
	}

	var newFullHostNames = testWeb.domains.map(function(d){return d.fullHostName;});
	var newHosts = hosts + newFullHostNames.map(function(newFullHostName){return `${EOL}${localHostIP}  ${newFullHostName}`}).join('');
	if(!(await writeToHostsFile(newHosts))){
		return;
	}
	console.log(`added host names ${newFullHostNames.join(', ')} to hosts file`);
	
	var addZeros = function(number, minLength){
		var result = number.toString();
		while(result.length < minLength){
			result = "0" + result;
		}
		return result;
	};

	var representDate = function(d){
		return `${addZeros(d.getHours(), 2)}:${addZeros(d.getMinutes(), 2)}:${addZeros(d.getSeconds(), 2)}.${addZeros(d.getMilliseconds(), 3)}`;
	}

	var server = http.createServer(function (req, res) {
		console.log(`[${representDate(new Date())}] ${req.headers.host}${req.url}`)
		if(!active){
			return writeError(res, 'stopped');
		}
		if(req.url === stopPath){
			stop();
			res.write('stopped');
			res.end();
			server.close();
			return;
		}
		testWeb.handle(req, res);
	});
	server.listen(8080);
	var testWebAddress = testWeb.getAddress();
	console.log(`test web running: visit ${testWebAddress}`);
})();
