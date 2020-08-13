var distinct = function(arr){
	return arr.filter(function(x, i){return arr.indexOf(x) === i;});
}
var mapMany = function(arr, mapFn){
	return arr.map(mapFn).reduce(function(a, b){return a.concat(b);}, []);
}

class Interface{
	constructor(name, getChildrenFn, parentInterfaces){
		this.name = name;
		this.getChildrenFn = getChildrenFn;
		this.parentInterfaces = parentInterfaces;
		this.childInterfaces = [];
	}
	addChild(child){
		this.childInterfaces.push(child);
	}
	isAssignableFromNode(n){
		return true;
	}
	getSelfAndParents(){
		var result = [this];
		var parentsParents = mapMany(this.parentInterfaces, function(p){return p.getSelfAndParents();});//this.parentInterfaces.map(function(p){return p.getSelfAndParents();}).reduce(function(a, b){return a.concat(b);}, []);
		result = result.concat(parentsParents);
		result = distinct(result);
		return result;
	}
	isMoreSpecificThan(t){
		if(t.hasChild(this)){
			return true;
		}
		return false;
	}
	getChildren(n){
		var selfAndParents = this.getSelfAndParents();

		return distinct(mapMany(selfAndParents, function(t){return t.getChildrenFn(n.node);}));
	}
	descendsFrom(typeName){
		return this.getSelfAndParents().findIndex(function(t){return t.name === typeName;});
	}
	hasChild(t){
		for(var child of this.childInterfaces){
			if(child === t || child.hasChild(t)){
				return true;
			}
		}
		return false;
	}
}
class NodeType extends Interface{
	constructor(typeName, name, getChildren, parentInterfaces){
		super(name, getChildren, parentInterfaces);
		this.typeName = typeName;
	}
	isAssignableFromNode(n){
		return n.type === this.typeName;
	}
	isMoreSpecificThan(n){
		return super.isMoreSpecificThan(n) || n.typeName === undefined;
	}
}
class NodeSubtype extends NodeType{
	constructor(typeName, test, name, getChildren, parentInterfaces){
		super(typeName, name, getChildren, parentInterfaces);
		this.test = test;
	}
	isAssignableFromNode(n){
		return super.isAssignableFromNode(n) && this.test(n);
	}
}
class InterfaceCollection{
	constructor(){
		this.interfaces = [];
	}
	getInterfaces(names){
		var result = this.interfaces.filter(function(i){return names.includes(i.name);});
		if(result.length !== names.length){
			throw new Error(`not all interfaces ${JSON.stringify(names)} are known yet`);
		}
		return result;
	}
	addChildToParents(child, parents){
		for(var parent of parents){
			parent.addChild(child);
		}
	}
	add(parentInterfaces, getNewInterface){
		parentInterfaces = this.getInterfaces(parentInterfaces);
		var newInterface = getNewInterface(parentInterfaces);
		if(this.interfaces.findIndex(function(i){return i.name === newInterface.name;}) > -1){
			throw new Error(`inteface '${newInterface.name}' is already defined`)
		}
		this.addChildToParents(newInterface, parentInterfaces);
		this.interfaces.push(newInterface);
	}
	addInterface(name, getChildren, parentInterfaces){
		this.add(parentInterfaces, function(p){return new Interface(name, getChildren, p);});
	}
	addNodeType(name, typeName, getChildren, parentInterfaces){
		this.add(parentInterfaces, function(p){return new NodeType(typeName, name, getChildren, p);});
	}
	addNodeSubtype(name, typeName, test, getChildren, parentInterfaces){
		this.add(parentInterfaces, function(p){return new NodeSubtype(typeName, test, name, getChildren, p);});
	}
	getNodeType(node){
		var types = this.interfaces.filter(function(i){return i.isAssignableFromNode(node);});
		if(!types.length){
			throw new Error(`${JSON.stringify(node.type)} is not a known type`)
		}
		var mostSpecific = types.filter(function(t){return types.findIndex(function(tt){return tt.isMoreSpecificThan(t);}) === -1;});
		if(mostSpecific.length > 1){
			throw new Error(`For node of type ${node.type}, cannot decide to which of ${mostSpecific.map(function(t){return t.name}).join(', ')} to assign`);
		}
		return mostSpecific[0];
	}
	getChildren(node){
		return this.getNodeType(node).getChildren(node);
	}
	findVisitorMethod(node, visitor){
		var nodeType = this.getNodeType(node);
		var eligibleTypes = [nodeType];
		var counter = 0;
		while(counter < 10){
			var eligibleMethod;
			var eligibleMethodName;
			//console.log(`looking at types ${eligibleTypes.map(function(t){return t.name}).join(', ')}`);
			for(var type of eligibleTypes){
				var visitorMethod = visitor[type.name];
				if(visitorMethod && eligibleMethod){
					throw new Error(`For node of type ${node.type}, cannot decide between methods '${eligibleMethodName}' and '${type.name}'`)
				}
				if(visitorMethod){
					eligibleMethod = visitorMethod;
					eligibleMethodName = type.name;
				}
			}
			if(eligibleMethod){
				//console.log(`found method by name '${eligibleMethodName}'`);
				return eligibleMethod;
			}
			eligibleTypes = mapMany(eligibleTypes, function(t){return t.parentInterfaces;}); //eligibleTypes.map(function(t){return t.parentInterfaces;}).reduce(function(a, b){return a.concat(b);}, []);
			eligibleTypes = distinct(eligibleTypes);//eligibleTypes.filter(function(t, i){return eligibleTypes.indexOf(t) === i;});
			if(eligibleTypes.length === 0){
				//console.log(`found no visitor method`)
				return undefined;
			}
			counter++;
		}
	}
	getNewVisitor(node, visitor){
		var visitorMethod = this.findVisitorMethod(node, visitor);
		if(!visitorMethod){
			return visitor;
		}
		return visitorMethod.apply(visitor, [node]);
	}
}

var collection = new InterfaceCollection();

class NodeWrapper{
	constructor(node, parent){
		this.node = node;
		this.parent = parent;
	}
	get type(){return this.node.type;}
	hasParentOfType(typeName){
		if(!this.parent){
			return false;
		}
		var parentType = collection.getNodeType(this.parent);
		return parentType.descendsFrom(typeName);
	}
}



var noChildren = function(){return [];};
var maybe = function(n){return n ? [n] : [];};

collection.addInterface("Node", noChildren, []);
collection.addInterface("Expression", noChildren, ["Node"]);
collection.addNodeType("Program", "Program", function(n){return n.body;}, ["Node"]);
collection.addInterface("Statement", noChildren, ["Node"]);
collection.addInterface("Function", function(n){return n.params.concat([n.body]).concat(maybe(n.id))}, ["Node"]);
collection.addNodeType("ExpressionStatement", "ExpressionStatement", function(n){return [n.expression];}, ["Statement"]);
collection.addNodeSubtype("Directive", "ExpressionStatement", function(n){return n.node.directive !== undefined;}, noChildren, ["ExpressionStatement"]);
collection.addNodeType("FunctionExpression", "FunctionExpression", noChildren, ["Function", "Expression"]);
collection.addNodeType("Literal", "Literal", noChildren, ["Expression"]);
collection.addNodeType("BlockStatement", "BlockStatement", function(n){return n.body;}, ["Statement"]);
collection.addInterface("Pattern", noChildren, ["Node"]);
collection.addNodeType("Identifier", "Identifier", noChildren, ["Expression", "Pattern"]);
collection.addNodeSubtype("RegExpLiteral", "Literal", function(n){return n.node.regex !== undefined;}, noChildren, ["Literal"]);
collection.addNodeSubtype("FunctionBody", "BlockStatement", function(n){return n.hasParentOfType("Function");}, noChildren, ["BlockStatement"]);
collection.addNodeType("EmptyStatement", "EmptyStatement", noChildren, ["Statement"]);
collection.addNodeType("DebuggerStatement", "DebuggerStatement", noChildren, ["Statement"]);
collection.addNodeType("WithStatement", "WithStatement", function(n){return [n.object, n.body];}, ["Statement"]);
collection.addNodeType("ReturnStatement", "ReturnStatement", function(n){return maybe(n.argument);}, ["Statement"]);
collection.addNodeType("LabeledStatement", "LabeledStatement", function(n){return [n.label, n.body];}, ["Statement"]);
collection.addNodeType("BreakStatement", "BreakStatement", function(n){return maybe(n.label);}, ["Statement"]);
collection.addNodeType("ContinueStatement", "ContinueStatement", function(n){return maybe(n.label);}, ["Statement"]);
collection.addNodeType("IfStatement", "IfStatement", function(n){return [n.test, n.consequent].concat(maybe(n.alternate));}, ["Statement"]);
collection.addNodeType("SwitchStatement", "SwitchStatement", function(n){return n.cases.concat([n.discriminant]);}, ["Statement"]);
collection.addNodeType("SwitchCase", "SwitchCase", function(n){return n.consequent.concat(maybe(n.test));}, ["Node"]);
collection.addNodeType("ThrowStatement", "ThrowStatement", function(n){return [n.argument];}, ["Statement"]);
collection.addNodeType("TryStatement", "TryStatement", function(n){return [n.block].concat(maybe(n.handler)).concat(maybe(n.finalizer));}, ["Statement"]);
collection.addNodeType("CatchClause", "CatchClause", function(n){return [n.param, n.body];}, ["Node"]);
collection.addNodeType("WhileStatement", "WhileStatement", function(n){return [n.test, n.body];}, ["Statement"]);
collection.addNodeType("DoWhileStatement", "DoWhileStatement", function(n){return [n.test, n.body];}, ["Statement"]);
collection.addNodeType("ForStatement", "ForStatement", function(n){return [n.body].concat(maybe(n.init)).concat(maybe(n.test)).concat(maybe(n.update));}, ["Statement"]);


var visit = function(node, visitor){
	(function continuation(node, visitor, parentNode){
		var children = collection.getChildren(node);
		for(var child of children){
			var childWrapped = new NodeWrapper(child, node);
			var newVisitor = collection.getNewVisitor(childWrapped, visitor);
			if(!newVisitor){
				return false;
			}
			if(!continuation(childWrapped, newVisitor)){
				return false;
			}
		}
		return true;
	})(new NodeWrapper(node), visitor);
};

module.exports = visit;