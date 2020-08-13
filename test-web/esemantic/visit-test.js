var visit = require('./visit');
var fs = require('fs');


var assertArraysAreEqual = function(arr1, arr2){
	if(arr1.length !== arr2.length){
		throw new Error(`expected arrays to be of same length`);
	}
	for(var i = 0; i < arr1.length; i++){
		if(arr1[i] !== arr2[i]){
			throw new Error(`expected ${JSON.stringify(arr1[i])} to equal  ${JSON.stringify(arr2[i])}`);
		}
	}
};

var createVisitorMethod = function(methodName, expectedNodeTypes){
	var actualNodeTypes = [];
	var method = function(n){
		if(n){
			actualNodeTypes.push(n.type);
		}
		return this;
	};
	var verify = function(){
		try{
			assertArraysAreEqual(expectedNodeTypes, actualNodeTypes);
		}catch(e){
			throw new Error(`expected method '${methodName}' to have received nodes of types ${JSON.stringify(expectedNodeTypes)}, but it received nodes of types ${JSON.stringify(actualNodeTypes)}. Assertion error: ${e.message}`);
		}
	};
	return {
		method: method,
		verify: verify
	};
};

var createTestVisitor = function(visitorCase){
	var result = {};
	var testMethods = [];
	for(var method of visitorCase.methods){
		var testMethod = createVisitorMethod(method.methodName, method.expectedNodeTypes);
		result[method.methodName] = testMethod.method;
		testMethods.push(testMethod);
	}
	var verify = function(){
		for(var testMethod of testMethods){
			testMethod.verify();
		}
	};
	return {
		visitor: result,
		verify: verify
	};
};

var runVisitorCase = function(testCase, index, visitorCase){
	var visitor = createTestVisitor(visitorCase);
	var encounteredException = false;
	try{
		visit(testCase.tree, visitor.visitor);
		visitor.verify();
	}catch(e){
		if(visitorCase.expectException){
			encounteredException = true;
		}else{
			throw new Error(`visitor case at index ${index} for tree representing script ${JSON.stringify(testCase.script)} failed. ` + e.stack)
		}
	}	
	if(visitorCase.expectException && !encounteredException){
		throw new Error(`visitor case at index ${index} for tree representing script ${JSON.stringify(testCase.script)} failed. Expected exception to be thrown.`)
	}
};

var runCase = function(testCase){
	for(var i = 0; i < testCase.visitorCases.length; i++){
		var visitorCase = testCase.visitorCases[i];
		runVisitorCase(testCase, i, visitorCase);
	}
};

var doTests = async function(){
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
	for(var testCase of cases){
		runCase(testCase);
	}
};

doTests().catch(function(e){console.log(e.stack);});