var replaceBlocks = function(input, openBlockPattern, closeBlockPattern, replaceBlockFn, replaceOutsideFn){
	var openBlockRegex = new RegExp(`^${openBlockPattern}$`);
	var openOrCloseRegex = new RegExp(`(?:${openBlockPattern}|${closeBlockPattern})`, "g");
	var currentLevel = 0;
	var result = '';
	var lastEndBlockIndex = -1;
	var lastStartBlockIndex = -1;
	var lastBlockOpenEndIndex = -1;
	var lastOpen;
	var match;
	var originalBlock;
	while((match = openOrCloseRegex.exec(input)) != null){
		//console.log(`match at index ${match.index}`)
		if(openBlockRegex.test(match[0])){
			if(currentLevel === 0){
				//console.log(`opening. lastEndBlockIndex = ${lastEndBlockIndex}`)
				result += replaceOutsideFn(input.substring(lastEndBlockIndex + 1, match.index));
				lastStartBlockIndex = match.index;
				lastBlockOpenEndIndex = match.index + match[0].length - 1;
			}
			currentLevel++;
		}else{
			currentLevel--;
			if(currentLevel === 0){
				lastEndBlockIndex = match.index + match[0].length - 1;
				//console.log(`closing. lastEndBlockIndex is now ${lastEndBlockIndex}`)
				lastOpen = input.substring(lastStartBlockIndex, lastBlockOpenEndIndex + 1);
				originalBlock = input.substring(lastBlockOpenEndIndex + 1, match.index);
				result += replaceBlockFn(lastOpen, originalBlock, match[0]);
			}
		}
		if(currentLevel < 0){
			throw new Error('unmatched openings and closings');
		}
	}
	if(currentLevel !== 0){
		throw new Error('unmatched openings and closings');
	}
	if(lastEndBlockIndex < input.length - 1){
		//console.log(`last part. lastEndBlockIndex = ${lastEndBlockIndex}`)
		var substring = replaceOutsideFn(input.substring(lastEndBlockIndex + 1));
		//console.log(`substring: ${substring}`)
		result += substring;
	}
	return result;
};

class TemplateExpression{
	constructor(text){
		this.text = text;
		this.namesToBind = undefined;
		this.executeFn = undefined;
		this.subTemplates = [];
	}
	createDummyValue(){
		var f = function(){return f;};
		return f;
	}
	compile(){
		var executeFnArgumentNames = ['map'];
		var executeFnDummyValues = [function(){}];
		this.namesToBind = [];
		var foundAll = false;
		var counter = 0;
		do{
			try{
				var executeFn = Function.apply(null, executeFnArgumentNames.concat([`return ${this.text}`]));
				executeFn.apply(null, executeFnDummyValues);
				foundAll = true;
			}catch(e){
				var match = e.message.match(/(^\S+) is not defined/);
				if(!match){
					throw new Error(`expression ${this.text} throws error: ${e.message}`);
				}
				executeFnArgumentNames.push(match[1]);
				this.namesToBind.push(match[1]);
				executeFnDummyValues.push(this.createDummyValue());
			}finally{
				counter++;
			}
		}while(!foundAll && counter < 100)
		this.executeFn = executeFn;
		this.compileSubTemplates();
		return this;
	}
	compileSubTemplates(){
		var self = this;
		var mapProxy = function(value, templateString){
			if(typeof templateString !== 'string'){
				throw new Error(`the second argument to 'map' has to be a compile-time string`);
			}
			var compiled = new Template(templateString).compile();
			self.subTemplates.push(compiled);
		}
		var values = [mapProxy].concat(this.namesToBind.map(this.createDummyValue.bind(this)));
		this.executeFn.apply(null, values);
	}
	executeMap(value, templateString, globalValues){
		var result = '';
		var template = this.subTemplates.find(function(t){return t.text === templateString});
		var index = 0;
		for(var item of value){
			var templateValues = {};
			Object.assign(templateValues, globalValues);
			templateValues.value = item;
			templateValues.index = index++;
			result += template.execute(templateValues);
		}
		return result;
	}
	execute(values){
		var self = this;
		var valueArray = values ? this.namesToBind.map(function(n){return values[n];}) : [];
		var mapFn = function(value, templateString){
			return self.executeMap(value, templateString, values);
		};
		return this.executeFn.apply(null, [mapFn].concat(valueArray));
	}
}

class Template{
	constructor(text){
		this.text = text;
		this.compiledExpressions = undefined;
		this.executeFn = undefined;
	}
	compile(){
		var expressionTexts = [];
		var expressionCounter = 0;
		var arrayName = 'expressionValues';
		var text = replaceBlocks(
			this.text,
			`\\{\\{`,
			`\\}\\}`,
			function(open, block, close){
				expressionTexts.push(block);
				return `\${${arrayName}[${expressionCounter++}]}`
			},
			function(outside){
				return outside.replace(/[`\\]/g, "\\$&");
			}
		);
		this.compiledExpressions = [];
		for(var i = 0; i < expressionTexts.length; i++){
			var expression = new TemplateExpression(expressionTexts[i]);
			try{
				expression.compile();
				this.compiledExpressions.push(expression);
			}catch(e){
				throw new Error(`Could not compile template: ${e.message}`);
			}
		}
		this.executeFn = new Function(arrayName, `return \`${text}\`;`);
		return this;
	}
	execute(values){
		var expressionValues = this.compiledExpressions.map(function(e){return e.execute(values);});
		return this.executeFn(expressionValues);
	}
}

console.assert(replaceBlocks("0()(4(6))9", "\\(", "\\)", function(open, block, close){return '[]';}, function(outside){return outside;}) === "0[][]9");
console.assert(replaceBlocks("(0(4(6))9)", "\\(", "\\)", function(open, block, close){return '[]';}, function(outside){return outside;}) === "[]");
console.assert(replaceBlocks("0(4(6))9", "\\(", "\\)", function(open, block, close){return '[]';}, function(outside){return outside;}) === "0[]9");
console.assert(replaceBlocks("1(0(4(6))9)", "\\(", "\\)", function(open, block, close){return '[]';}, function(outside){return outside;}) === "1[]");
console.assert(replaceBlocks("(0(4(6))9)1", "\\(", "\\)", function(open, block, close){return '[]';}, function(outside){return outside;}) === "[]1");

console.assert(new TemplateExpression("x").compile().execute({x: 4}) === 4);

console.assert(new Template(`{{x}} !== {{x + 1}}`).compile().execute({x : 2}) === '2 !== 3');
console.assert(new Template(`the {{things.length}} things are {{map(things, '{{JSON.stringify(value)}} at index {{index}}, ')}}`).compile().execute({things: [1, "a", {b: 9}]}) === "the 3 things are 1 at index 0, \"a\" at index 1, {\"b\":9} at index 2, ");
console.assert(new Template(`<ul>{{map(items, '<li>{{f(value)}}</li>')}}</ul>`).compile().execute({items: ["a", "b", "c"], f: function(text){return `${text}!`}}) === '<ul><li>a!</li><li>b!</li><li>c!</li></ul>');

module.exports = Template;

