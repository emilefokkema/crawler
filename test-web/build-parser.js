var fsp = require('./fs-promise-wrapper');
var peg = require("pegjs");

var parser = undefined;
var whenTestsHaveRun;

var createParser = async function(){
	var definition = await fsp.readFile('./parser-definition.peg', 'utf8');
	return peg.generate(definition);
};

var compileTemplate = async function(string){
	if(!parser){
		parser = await createParser();
	}
	var parsed = parser.parse(string);
	console.log(parsed);
};

var testsPass = true;
var testCases = [
		{
			template: "{{x}} !== {{x + 1}}",
			data: {x : 2},
			expectedResult: "2 !== 3"
		}
	];

var runTest = async function(testCase, fail){
	try{
		var compiled = await compileTemplate(testCase.template);
	}catch(e){
		fail(e.message);
	}
};

var runTests = async function(){
	var fail = function(msg){
		console.error(`test fails: ${msg}`);
		testsPass = false;
	}
	await Promise.all(testCases.map(function(t){return runTest(t, fail);}));
};

whenTestsHaveRun = runTests();

module.exports = async function(string){
	await whenTestsHaveRun;
	console.assert(testsPass);
	return await compileTemplate(string);
};