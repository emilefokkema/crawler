var createDummyValue = function(){
	var f = function(){return f;};
	return f;
};

var getUnboundNames = function(expression){
	var result = [];
	var dummyValues = [];
	var foundAll = false;
	var counter = 0;
	do{
		try{
			Function.apply(null, result.concat([expression])).apply(null, dummyValues);
			foundAll = true;
		}catch(e){
			var match = e.message.match(/(^\S+) is not defined/);
			if(!match){
				throw new Error(`expression ${expression} throws error: ${e.message}`);
			}
			result.push(match[1]);
			dummyValues.push(createDummyValue());
		}finally{
			counter++;
		}
	}while(!foundAll && counter < 100)
	return result;
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

console.assert(unboundNamesForExpressionAre("x", ["x"]));
console.assert(unboundNamesForExpressionAre("x + y", ["x", "y"]));
console.assert(unboundNamesForExpressionAre("x && y", ["x", "y"]));
console.assert(unboundNamesForExpressionAre("x || y", ["x", "y"]));

module.exports = getUnboundNames;