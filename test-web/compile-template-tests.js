var compileTemplate = require('./compile-template');

var testCases = [
	{
		template: "if(a || b){{either one!}}",
		cases: [
			{
				data: {a: true, b: false},
				expectedResult: "either one!"
			},
			{
				data: {a: false, b: true},
				expectedResult: "",
				ignored: true
			}
		]
	},
	{
		template: "{{x}} !== {{x + 1}}",
		cases: [
			{
				data: {x : 2},
				expectedResult: "2 !== 3"
			}
		]
	},
	{
		template: "if(a % 2 == 0){{{{a}} is even}}",
		cases: [
			{
				data: {a: 2},
				expectedResult: "2 is even"
			},
			{
				data: {a: 4},
				expectedResult: "4 is even"
			},
			{
				data: {a: 3},
				expectedResult: ""
			}
		]
	}
];

var getCasesToRun = function(cases){
	var oneIsFocussed = cases.findIndex(function(c){return c.focussed;}) > -1;
	return cases.filter(function(c){return !c.ignored && (!oneIsFocussed || c.focussed);});
};

var compareDataToResult = function(template, data, expectedResult, fail){
	var actualResult = template.execute(data);
	if(actualResult !== expectedResult){
		fail(`${JSON.stringify(actualResult)} is not equal to ${JSON.stringify(expectedResult)}`);
	}
};

var runTest = async function(testCase, fail, ignore){
	try{
		var template = await compileTemplate(testCase.template);
		var casesToRun = getCasesToRun(testCase.cases);
		if(casesToRun.length < testCase.cases.length){
			ignore();
		}
		for(var i = 0; i < casesToRun.length; i++){
			compareDataToResult(template, casesToRun[i].data, casesToRun[i].expectedResult, fail);
		}
	}catch(e){
		fail(e.stack);
	}
};

var runTests = async function(){
	var result = {success: true};
	var fail = function(msg){
		if(!result.success){
			return;
		}
		result.success = false;
		result.msg = msg;
	}
	var ignore = function(){
		result.someIgnored = true;
	};
	var casesToRun = getCasesToRun(testCases);
	if(casesToRun.length < testCases.length){
		ignore();
	}
	await Promise.all(casesToRun.map(function(c){return runTest(c, fail, ignore);}));
	return result;
};

(async function(){
	var result = await runTests();
	if(result.success){
		if(result.someIgnored){
			console.log(`all pass, but some were ignored`)
		}else{
			console.log(`all pass.`)
		}
	}else{
		console.log(result.msg);
	}
})()

module.exports = runTests;