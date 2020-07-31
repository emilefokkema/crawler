var visit = require('./visit');
var acorn = require('acorn');

var tree = acorn.parse('\'use strict\';');

var visitor = {
	Node: function(node){console.log(`visits node: `, node);}
};

visit(tree, visitor);