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
				expectedResult: ""
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

var compareDataToResult = function(template, data, expectedResult, fail){
	var actualResult = template.execute(data);
	if(actualResult !== expectedResult){
		fail(`${JSON.stringify(actualResult)} is not equal to ${JSON.stringify(expectedResult)}`);
	}
};

var runTest = async function(testCase, fail){
	try{
		var template = await compileTemplate(testCase.template);
		for(var i = 0; i < testCase.cases.length; i++){
			compareDataToResult(template, testCase.cases[i].data, testCase.cases[i].expectedResult, fail);
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
	await Promise.all(testCases.map(function(c){return runTest(c, fail);}));
	return result;
};

(async function(){
	var result = await runTests();
	if(result.success){
		console.log(`all pass.`)
	}else{
		console.log(result.msg);
	}
})()

module.exports = runTests;