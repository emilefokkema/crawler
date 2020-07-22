var acorn = require('acorn');
var walk = require('acorn-walk')

var scopeId = 0;
var nodeContextId = 0;

class Scope{
	constructor(){
		this.scopeId = scopeId++;
		this.scopes = [];
	}
	addName(name){
		console.log(`adding name ${JSON.stringify(name)} to scope ${this.scopeId}`);
	}
	addScope(){
		var newScope = new Scope();
		return newScope;
	}
}

class NodeContext{
	constructor(scope){
		this.scope = scope;
		this.nodeContextId = nodeContextId++;
	}
	withChild(){
		return new NodeContext(this.scope);
	}
	withStatement(node){
		if(node.type === "FunctionDeclaration"){
			this.scope.addName(node.id.name);
			return this.withFunctionExpression(node);
		}
		return this.withChild();
	}
	withFunctionExpression(node){
		return new FunctionNodeContext(this.scope.addScope(), node);
	}
	withExpression(node){
		if(node.type === "FunctionExpression"){
			return this.withFunctionExpression(node);
		}
		return this.withChild();
	}
}

class FunctionNodeContext extends NodeContext{
	constructor(scope, functionNode){
		super(scope);
		var params = functionNode.params;
		for(var i = 0; i < params.length; i++){
			this.scope.addName(params[i].name);
		}
	}
}

class TopNodeContext extends NodeContext{
	constructor(scope, expression){
		super(scope);
		this.hasExpression = false;
		this.expression = expression;
	}
	throwError(){
		throw new Error(`${JSON.stringify(this.expression)} is not a single expression`);
	}
	withStatement(node){
		if(node.type !== "ExpressionStatement"){
			this.throwError();
		}
		if(this.hasExpression){
			this.throwError();
		}
		this.hasExpression = true;
		return super.withStatement(node);
	}
}

var getUnboundNames = function(expression){
	var tree = acorn.parse(expression);
	var topScope = new Scope();
	var topNodeContext = new TopNodeContext(topScope, expression);
	walk.recursive(tree, topNodeContext, {
		Statement: function(node, context, c){
			c(node, context.withStatement(node));
		},
		Expression: function(node, context, c){
			c(node, context.withExpression(node));
		}
	});
};

var unboundNamesForExpressionAre = function(expression, expected){
	var actual = getUnboundNames(expression);
	if(actual.length !== expected.length){
		return false;
	}
	for(var i = 0; i < expected.length; i++){
		if(actual.findIndex(function(n){return n === expected[i];}) === -1){
			return false;
		}
	}
	return true;
};

//getUnboundNames(" (function(y){let x;})");
getUnboundNames(" (function(y){function b(a){}})");
//getUnboundNames("x + y");
//getUnboundNames("let x; y");
//getUnboundNames("let x");

//console.assert(unboundNamesForExpressionAre("x", ["x"]));
//console.assert(unboundNamesForExpressionAre("x + y", ["x", "y"]));
//console.assert(unboundNamesForExpressionAre("x && y", ["x", "y"]));
//console.assert(unboundNamesForExpressionAre("x || y", ["x", "y"]));

module.exports = getUnboundNames;