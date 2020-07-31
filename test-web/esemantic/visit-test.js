var visit = require('./visit');
var acorn = require('acorn');

var tree = acorn.parse('(function a(b, c){x = 2; return b;})()');

var visitor = {
	Node: function(node){console.log(`visits node: `, node);}
};

visit(tree, visitor);