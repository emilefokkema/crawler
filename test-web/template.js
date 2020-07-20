var BlockMatcher = require('./block-matcher');

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
}

class IfTemplateExpression{
	constructor(ifCall, templateText){
		var ifCallMatch = ifCall.match(/^if\((.*)\)$/);
		this.ifExpressionText = ifCallMatch[1];
		this.templateText = templateText;
		this.thenTemplate = undefined;
		this.ifExpression = undefined;
	}
	compile(){
		this.thenTemplate = new Template(this.templateText).compile();
		this.ifExpression = new TemplateExpression(this.ifExpressionText).compile();
	}
	execute(values){
		var ifValue = this.ifExpression.execute(values);
		return ifValue ? this.thenTemplate.execute(values) : '';
	}
}

class ForTemplateExpression{
	constructor(repeatCall, templateText){
		var repeatCallMatch = repeatCall.match(/^for\(\s*([^,\s]+)(?:\s*,\s*(\S+))?\s*of(.*)\)$/);
		this.iterableExpressionText = repeatCallMatch[3];
		this.itemName = repeatCallMatch[1];
		this.indexName = repeatCallMatch[2];
		this.templateText = templateText;
		this.repeatingTemplate = undefined;
		this.iterableExpression = undefined;
	}
	compile(){
		this.repeatingTemplate = new Template(this.templateText).compile();
		this.iterableExpression = new TemplateExpression(this.iterableExpressionText).compile();
	}
	execute(values){
		var result = '';
		var iterableValue = this.iterableExpression.execute(values);
		var index = 0;
		for(var item of iterableValue){
			var templateValues = {};
			Object.assign(templateValues, values);
			templateValues[this.itemName] = item;
			if(this.indexName){
				templateValues[this.indexName] = index++;
			}
			result += this.repeatingTemplate.execute(templateValues);
		}
		return result;
	}
}

class TemplateExpression{
	constructor(text){
		this.text = text;
		this.namesToBind = undefined;
		this.executeFn = undefined;
		this.subTemplates = [];
	}
	compile(){
		this.namesToBind = getUnboundNames(this.text);
		this.executeFn = Function.apply(null, this.namesToBind.concat([`return ${this.text}`]));
		return this;
	}
	execute(values){
		var valueArray = values ? this.namesToBind.map(function(n){return values[n];}) : [];
		return this.executeFn.apply(null, valueArray);
	}
}

class Template{
	constructor(text){
		this.text = text;
		this.compiledExpressions = undefined;
		this.executeFn = undefined;
	}
	compile(){
		var self = this;
		var matcher = new BlockMatcher(/(?:(?:for|if)\((?:[^{]|\{[^{])*\))?\{\{/.source, /\}\}/.source);
		this.compiledExpressions = [];
		var expressionCounter = 0;
		var arrayName = 'expressionValues';
		var text = matcher.replace(
			this.text,
			function(open, block, close){
				var expression;
				var openMatch = open.match(/^(for\(.*\))?(if\(.*\))?\{\{/);
				if(openMatch[1]){
					expression = new ForTemplateExpression(openMatch[1], block);
				}else if(openMatch[2]){
					expression = new IfTemplateExpression(openMatch[2], block);
				}else{
					expression = new TemplateExpression(block);
				}
				try{
					expression.compile();
					self.compiledExpressions.push(expression);
				}catch(e){
					throw new Error(`Could not compile template: ${e.message}`);
				}
				return `\${${arrayName}[${expressionCounter++}]}`
			},
			function(outside){
				return outside.replace(/[`\\]/g, "\\$&");
			}
		);
		this.executeFn = new Function(arrayName, `return \`${text}\`;`);
		return this;
	}
	execute(values){
		var expressionValues = this.compiledExpressions.map(function(e){return e.execute(values);});
		return this.executeFn(expressionValues);
	}
}

console.assert(new TemplateExpression("x").compile().execute({x: 4}) === 4);

console.assert(new Template(`{{x}} !== {{x + 1}}`).compile().execute({x : 2}) === '2 !== 3');
console.assert(new Template(`the {{things.length}} things are for(thing, index of things){{{{JSON.stringify(thing)}} at index {{index}}, }}`).compile().execute({things: [1, "a", {b: 9}]}) === "the 3 things are 1 at index 0, \"a\" at index 1, {\"b\":9} at index 2, ");
console.assert(new Template(`<ul>for(item of items){{<li>{{f(item)}}</li>}}</ul>`).compile().execute({items: ["a", "b", "c"], f: function(text){return `${text}!`}}) === '<ul><li>a!</li><li>b!</li><li>c!</li></ul>');

console.assert(new Template(`for(number of numbers){{if(number % 2 === 0){{{{number}} is even }}}}`).compile().execute({numbers: [1, 2, 3, 4, 5, 6]}) === '2 is even 4 is even 6 is even ');

console.assert(new Template(`if((function(){return 1;})()){{<}}`).compile().execute() === '<');

console.assert(new Template(`dat zijn for(number, index of numbers){{{{number}} (at index {{index}}), }}`).compile().execute({numbers: [1, 2, 3, 4]}) === 'dat zijn 1 (at index 0), 2 (at index 1), 3 (at index 2), 4 (at index 3), ');

module.exports = Template;

