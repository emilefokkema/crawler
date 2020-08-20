var acorn = require('acorn');
var fs = require('fs');

var addCaseForScript = async function(script){
	var tree = acorn.parse(script);
	var casesJson = await new Promise(function(res, rej){
		fs.readFile('cases.json', 'utf8', function(err, data){
			if(err){
				rej(err);
			}else{
				res(data);
			}
		});
	});
	var cases = JSON.parse(casesJson);
	cases.push({
		script: script,
		tree: tree,
		visitorCases: [
			{
				methods: [
					{
						methodName: 'Foo',
						expectedNodeTypes: ['Bar']
					}
				]
			}
		]
	});
	casesJson = JSON.stringify(cases, undefined, 1);
	await new Promise(function(res, rej){
		fs.writeFile('cases.json', casesJson, 'utf8', function(err){
			if(err){
				rej(err);
			}else{
				res();
			}
		});
	});
};

addCaseForScript('a.b;').catch(function(e){console.log(e.stack);});
