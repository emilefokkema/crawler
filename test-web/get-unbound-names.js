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
	withVariableDeclaration(node){
		return new VariableDeclarationNodeContext(this.scope, node.kind);
	}
	withStatement(node){
		if(node.type === "FunctionDeclaration"){
			this.scope.addName(node.id.name);
			return this.withFunction(node);
		}
		return this.withChild();
	}
	withVariableDeclarator(node){
		return this.withChild();
	}
	withFunction(node){
		return new FunctionNodeContext(this.scope, node);
	}
	withExpression(node){
		if(node.type === "FunctionExpression"){
			return this.withFunction(node);
		}
		return this.withChild();
	}
}

class VariableDeclarationNodeContext extends NodeContext{
	constructor(scope, kind){
		super(scope);
		console.log(`created variable declaration context of kind ${kind}`);
	}
	withVariableDeclarator(node){
		console.log(`adding declarator to declaration: `, node);
		return super.withVariableDeclarator();
	}
}

class FunctionNodeContext extends NodeContext{
	constructor(scope, functionNode){
		super(scope);
		this.functionNode = functionNode;
	}
	withStatement(node){
		if(node.type !== "BlockStatement"){
			throw new Error(`did not expect node of type ${this.functionNode.type} to have direct child of type ${node.type}`)
		}
		var newScope = this.scope.addScope();
		var params = this.functionNode.params;
		for(var i = 0; i < params.length; i++){
			newScope.addName(params[i].name);
		}
		return new NodeContext(newScope);
	}
}

var getUnboundNames = function(expression){
	var tree = acorn.parse(expression);
	if(tree.body.length !== 1 || tree.body[0].type !== "ExpressionStatement"){
		throw new Error(`${JSON.stringify(expression)} is not a single expression`);
	}
	var expressionTree = tree.body[0];
	var topScope = new Scope();
	var topNodeContext = new NodeContext(topScope);
	walk.recursive(expressionTree, topNodeContext, {
		Statement: function(node, context, c){
			if(node.type === "VariableDeclaration"){
				var declarationContext = context.withVariableDeclaration(node);
				for(var i = 0; i < node.declarations.length; i++){
					c(node.declarations[i], declarationContext.withVariableDeclarator(node.declarations[i]));
				}
				return;
			}
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

getUnboundNames(" (function(y){let x;})");
//getUnboundNames(" (function(y){function b(a){}})");
//getUnboundNames("x + y");
//getUnboundNames("let x; y");
//getUnboundNames("let x");

//console.assert(unboundNamesForExpressionAre("x", ["x"]));
//console.assert(unboundNamesForExpressionAre("x + y", ["x", "y"]));
//console.assert(unboundNamesForExpressionAre("x && y", ["x", "y"]));
//console.assert(unboundNamesForExpressionAre("x || y", ["x", "y"]));

module.exports = getUnboundNames;