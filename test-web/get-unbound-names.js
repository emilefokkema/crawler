var acorn = require('acorn');
var walk = require('acorn-walk')

var scopeId = 0;
var contextId = 0;


class Context{
	constructor(parentContext){
		this.parentContext = parentContext;
		this.contextId = contextId++;
	}
	addFunctionDeclaration(functionDeclarationNode){
		console.log(`context ${this.contextId} adding function declaration called: ${functionDeclarationNode.id.name}`);
	}
	addFunctionParameterDeclaration(patternNode){
		console.log(`context ${this.contextId} adding function parameter declaration: `, patternNode);
	}
	addVariableDeclaration(variableDeclaratorNode, variableDeclarationNode){
		console.log(`context ${this.contextId} adding ${JSON.stringify(variableDeclarationNode.kind)} declaration `, variableDeclaratorNode)
	}
	FunctionDeclaration(node){
		this.addFunctionDeclaration(node);
		return new FunctionContext(node, this);
	}
	VariableDeclaration(node){
		return new VariableDeclarationContext(node, this);
	}
	Expression(node){
		//console.log(`context ${this.contextId} encountered expression `, node);
		if(node.type === "FunctionExpression"){
			//console.log(`context ${this.contextId} encountered function expression `, node);
			return new FunctionContext(node, this);
		}
		if(node.type === "MemberExpression"){
			//console.log(`context ${this.contextId} encountered member expression `, node);
			return new MemberExpressionContext(node, this);
		}
		if(node.type === "ObjectExpression"){
			//console.log(`context ${this.contextId} encountered object expression `, node);
			return new ObjectExpressionContext(node, this);
		}
		if(node.type === "Identifier"){
			console.log(`context ${this.contextId} encountered identifier `, node);
		}
		return this;
	}
}

class VariableDeclarationContext {
	constructor(variableDeclarationNode, parentContext){
		//console.log(`creating variable declaration context of kind ${variableDeclarationNode.kind}`);
		this.variableDeclarationNode = variableDeclarationNode;
		this.parentContext = parentContext;
	}
	VariableDeclarator(node){
		this.parentContext.addVariableDeclaration(node, this.variableDeclarationNode);
	}
}

class MemberExpressionContext{
	constructor(memberExpressionNode, parentContext){
		this.memberExpressionNode = memberExpressionNode;
		this.parentContext = parentContext;
	}
	Expression(node){
		if(node === this.memberExpressionNode.property && !this.memberExpressionNode.computed){
			console.log(`member expression uses property `, node);
			return;
		}
		return this.parentContext.Expression(node);
	}
}

class ObjectExpressionContext{
	constructor(objectExpressionNode, parentContext){
		this.objectExpressionNode = objectExpressionNode;
		this.parentContext = parentContext;
	}
	Property(node){
		console.log(`object expression context encountered property `, node)
	}
}

class FunctionContext {
	constructor(functionNode, parentContext){
		//console.log(`creating function context for `, functionNode);
		this.functionNode = functionNode;
		this.parentContext = parentContext;
	}
	BlockStatement(node){
		//console.log(`opening block statement. params are`, this.functionNode.params);
		var newContext = new Context(this);
		for(var i = 0; i < this.functionNode.params.length; i++){
			newContext.addFunctionParameterDeclaration(this.functionNode.params[i]);
		}
		return newContext;
	}
}

var getUnboundNames = function(expression){
	var tree = acorn.parse(expression);
	if(tree.body.length !== 1 || tree.body[0].type !== "ExpressionStatement"){
		throw new Error(`${JSON.stringify(expression)} is not a single expression`);
	}
	var expressionTree = tree.body[0];
	var topNodeContext = new Context();
	var visitor = {};
	for(var type in walk.base){
		visitor[type] = (function(baseFn, type){
			return function(node, context, c){
				//console.log(`visitor for ${type} encountered node of type ${node.type} in context `, context);
				var newContext = (context && context[type]) ? context[type](node) : context;
				baseFn(node, newContext, c);
			};
		})(walk.base[type], type);
	}
	walk.recursive(expressionTree, topNodeContext, visitor);
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

getUnboundNames(" (function(y){let x; ({a: b})})");
//getUnboundNames(" (function(y){let x; x.y.z})");
//getUnboundNames(" (function(y){let x; x + y})");
//getUnboundNames(" (function(y){let x;})");
//getUnboundNames(" (function(y){function b(a){}})");
//getUnboundNames("x + y");
//getUnboundNames("let x; y");
//getUnboundNames("let x");

//console.assert(unboundNamesForExpressionAre("x", ["x"]));
//console.assert(unboundNamesForExpressionAre("x + y", ["x", "y"]));
//console.assert(unboundNamesForExpressionAre("x && y", ["x", "y"]));
//console.assert(unboundNamesForExpressionAre("x || y", ["x", "y"]));

module.exports = getUnboundNames;