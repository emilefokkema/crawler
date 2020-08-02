var visit = require('./visit');
var acorn = require('acorn');

var cases = [
	{
		script: '\'use strict\';',
		tree: {
			 "type": "Program",
			 "start": 0,
			 "end": 13,
			 "body": [
			  {
			   "type": "ExpressionStatement",
			   "start": 0,
			   "end": 13,
			   "expression": {
			    "type": "Literal",
			    "start": 0,
			    "end": 12,
			    "value": "use strict",
			    "raw": "'use strict'"
			   },
			   "directive": "use strict"
			  }
			 ],
			 "sourceType": "script"
			},
		visitorCases: [
			{
				methods: [
					{
						methodName: "Node",
						expectedNodeTypes: ["ExpressionStatement", "Literal"]
					}
				]
			},
			{
				methods: [
					{
						methodName: "Node",
						expectedNodeTypes: ["Literal"]
					},
					{
						methodName: "Statement",
						expectedNodeTypes: ["ExpressionStatement"]
					}
				]
			},
			{
				methods: [
					{
						methodName: "Expression",
						expectedNodeTypes: []
					},
					{
						methodName: "Literal",
						expectedNodeTypes: ["Literal"]
					},
					{
						methodName: "Statement",
						expectedNodeTypes: ["ExpressionStatement"]
					}
				]
			},
			{
				methods: [
					{
						methodName: "Expression",
						expectedNodeTypes: ["Literal"]
					},
					{
						methodName: "Statement",
						expectedNodeTypes: ["ExpressionStatement"]
					}
				]
			},
			{
				methods: [
					{
						methodName: "Node",
						expectedNodeTypes: ["Literal"]
					},
					{
						methodName: "ExpressionStatement",
						expectedNodeTypes: ["ExpressionStatement"]
					}
				]
			},
			{
				methods: [
					{
						methodName: "Node",
						expectedNodeTypes: ["Literal"]
					},
					{
						methodName: "Statement",
						expectedNodeTypes: []
					},
					{
						methodName: "ExpressionStatement",
						expectedNodeTypes: ["ExpressionStatement"]
					}
				]
			},
			{
				methods: [
					{
						methodName: "Node",
						expectedNodeTypes: ["Literal"]
					},
					{
						methodName: "Statement",
						expectedNodeTypes: []
					},
					{
						methodName: "ExpressionStatement",
						expectedNodeTypes: []
					},
					{
						methodName: "Directive",
						expectedNodeTypes: ["ExpressionStatement"]
					}
				]
			}
		]
	},
	{
		script: '(function(){})',
		tree: {
			 "type": "Program",
			 "start": 0,
			 "end": 14,
			 "body": [
			  {
			   "type": "ExpressionStatement",
			   "start": 0,
			   "end": 14,
			   "expression": {
			    "type": "FunctionExpression",
			    "start": 1,
			    "end": 13,
			    "id": null,
			    "expression": false,
			    "generator": false,
			    "async": false,
			    "params": [],
			    "body": {
			     "type": "BlockStatement",
			     "start": 11,
			     "end": 13,
			     "body": []
			    }
			   }
			  }
			 ],
			 "sourceType": "script"
			},
		visitorCases: [
			{
				methods: [
					{
						methodName: "Node",
						expectedNodeTypes: ["ExpressionStatement", "FunctionExpression", "BlockStatement"]
					}
				]
			},
			{
				methods: [
					{
						methodName: "Function",
						expectedNodeTypes: []
					},
					{
						methodName: "Expression",
						expectedNodeTypes: []
					}
				],
				expectException: true
			},
		]
	},
	{
		script: '/a/;',
		tree: {
		 "type": "Program",
		 "start": 0,
		 "end": 3,
		 "body": [
		  {
		   "type": "ExpressionStatement",
		   "start": 0,
		   "end": 3,
		   "expression": {
		    "type": "Literal",
		    "start": 0,
		    "end": 3,
		    "value": {},
		    "raw": "/a/",
		    "regex": {
		     "pattern": "a",
		     "flags": ""
		    }
		   }
		  }
		 ],
		 "sourceType": "script"
		},
		visitorCases: [
			{
				methods: [
					{
						methodName: "RegExpLiteral",
						expectedNodeTypes: ["Literal"]
					},
				]
			}
		]
	}
];

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
			throw new Error(`visitor case at index ${index} for tree representing script ${JSON.stringify(testCase.script)} failed. ` + e.message)
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

for(var testCase of cases){
	runCase(testCase);
}
//var tree = acorn.parse('/a/');


// var tree = acorn.parse('(function(){})');
//console.log(JSON.stringify(tree, undefined, 1))
//var tree = acorn.parse('var x = 1+1;');

// var visitor = {
// 	Node: function(node){console.log(`visits node: `, node.type);return this;}
	
// };

// visit(tree, visitor);