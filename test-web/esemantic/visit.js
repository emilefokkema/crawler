class Interface{
	constructor(name, getChildren, parentInterfaces){
		this.name = name;
		this.getChildren = getChildren;
		this.parentInterfaces = parentInterfaces;
	}
}
class NodeType extends Interface{
	constructor(typeName, getChildren, parentInterfaces){
		super(typeName, getChildren, parentInterfaces);
		this.typeName = typeName;
	}
}
class InterfaceCollection{
	constructor(){
		this.interfaces = [];
	}
	addInterface(name, getChildren, parentInterfaces){
		parentInterfaces = this.interfaces.filter(function(i){return parentInterfaces.includes(i.name);});
		this.interfaces.push(new Interface(name, getChildren, parentInterfaces));
	}
	addNodeType(typeName, getChildren, parentInterfaces){
		parentInterfaces = this.interfaces.filter(function(i){return parentInterfaces.includes(i.name);});
		this.interfaces.push(new NodeType(typeName, getChildren, parentInterfaces));
	}
	getNodeType(node){
		var nodeType = this.interfaces.find(function(i){return i.typeName === node.type;});
		if(!nodeType){
			throw new Error(`${JSON.stringify(typeName)} is not a known type`)
		}
		return nodeType;
	}
	getChildren(node){
		return this.getNodeType(node).getChildren(node);
	}
	getNewVisitor(node, visitor){
		var nodeType = this.getNodeType(node);
	}
}

var collection = new InterfaceCollection();

var noChildren = function(){return [];};

collection.addInterface("Node", noChildren, []);
collection.addInterface("Expression", noChildren, ["Node"]);
collection.addNodeType("Program", function(n){return n.body;}, ["Node"]);
collection.addInterface("Expression", noChildren, ["Node"]);
collection.addInterface("Statement", noChildren, ["Node"]);
collection.addInterface("Function", function(n){return n.params.concat([n.body]).concat(n.id ? [n.id] : [])}, ["Node"]);
collection.addNodeType("ExpressionStatement", function(n){return [n.expression];}, ["Statement"])


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