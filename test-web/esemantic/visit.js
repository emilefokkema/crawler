class Interface{
	constructor(name, getChildren, parentInterfaces){
		this.name = name;
		this.getChildren = getChildren;
		this.parentInterfaces = parentInterfaces;
		this.childInterfaces = [];
	}
	addChild(child){
		this.childInterfaces.push(child);
	}
	isAssignableFromNode(n){
		return true;
	}
	isMoreSpecificThan(t){
		if(t.hasChild(this)){
			return true;
		}
		return false;
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
	addNodeType(typeName, name, getChildren, parentInterfaces){
		this.add(parentInterfaces, function(p){return new NodeType(typeName, name, getChildren, p);});
	}
	addNodeSubtype(typeName, test, name, getChildren, parentInterfaces){
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
		while(counter < 5){
			var eligibleMethod;
			var eligibleMethodName;
			console.log(`looking at types ${eligibleTypes.map(function(t){return t.name}).join(', ')}`);
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
				console.log(`found method by name '${eligibleMethodName}'`);
				return eligibleMethod;
			}
			eligibleTypes = eligibleTypes.map(function(t){return t.parentInterfaces;}).reduce(function(a, b){return a.concat(b);}, []);
			eligibleTypes = eligibleTypes.filter(function(t, i){return eligibleTypes.indexOf(t) === i;});
			counter++;
		}
	}
	getNewVisitor(node, visitor){
		console.log(`going to get new visitor for node `, node)
		this.findVisitorMethod(node, visitor);
		
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
collection.addNodeSubtype("ExpressionStatement", function(n){return n.directive !== undefined;}, "Directive", noChildren, ["ExpressionStatement"]);


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