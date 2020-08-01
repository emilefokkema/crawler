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

		return distinct(mapMany(selfAndParents, function(t){return t.getChildrenFn(n);}));
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
		return this.interfaces.filter(function(i){return names.includes(i.name);});
	}
	addChildToParents(child, parents){
		for(var parent of parents){
			parent.addChild(child);
		}
	}
	add(parentInterfaces, getNewInterface){
		parentInterfaces = this.getInterfaces(parentInterfaces);
		var newInterface = getNewInterface(parentInterfaces);
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
					throw new Error(`cannot decide between methods '${eligibleMethodName}' and '${type.name}'`)
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
			console.log(`found no suitable method for node of type ${node.type}, using the same visitor`);
			return visitor;
		}
		return visitorMethod.apply(visitor, [node]);
	}
}

var collection = new InterfaceCollection();

var noChildren = function(){return [];};

collection.addInterface("Node", noChildren, []);
collection.addInterface("Expression", noChildren, ["Node"]);
collection.addNodeType("Program", "Program", function(n){return n.body;}, ["Node"]);
collection.addInterface("Statement", noChildren, ["Node"]);
collection.addInterface("Function", function(n){return n.params.concat([n.body]).concat(n.id ? [n.id] : [])}, ["Node"]);
collection.addNodeType("ExpressionStatement", "ExpressionStatement", function(n){return [n.expression];}, ["Statement"]);
collection.addNodeSubtype("Directive", "ExpressionStatement", function(n){return n.directive !== undefined;}, noChildren, ["ExpressionStatement"]);
collection.addNodeType("FunctionExpression", "FunctionExpression", noChildren, ["Function", "Expression"]);
collection.addNodeType("Literal", "Literal", noChildren, ["Expression"]);
collection.addNodeType("BlockStatement", "BlockStatement", function(n){return n.body;}, ["Statement"]);

var visit = function(node, visitor){
	(function continuation(node, visitor){
		var children = collection.getChildren(node);
		for(var child of children){
			var newVisitor = collection.getNewVisitor(child, visitor);
			if(!newVisitor){
				return false;
			}
			if(!continuation(child, newVisitor)){
				return false;
			}
		}
		return true;
	})(node, visitor);
};

module.exports = visit;