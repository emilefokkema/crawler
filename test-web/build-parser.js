var fsp = require('./fs-promise-wrapper');
var peg = require("pegjs");

var parser = undefined;
var whenTestsHaveRun;

var createParser = async function(){
	var definition = await fsp.readFile('./parser-definition.peg', 'utf8');
	return peg.generate(definition);
};

var createDummyValue = function(){
	var f = function(){return f;};
	return f;
};

class TemplateExpression{
	constructor(expression, namesToBind){
		this.namesToBind = namesToBind;
		this.executeFn = Function.apply(null, namesToBind.concat([`return ${expression};`]));
	}
	execute(values){
		var valueArray = values ? this.namesToBind.map(function(n){return values[n];}) : [];
		return this.executeFn.apply(null, valueArray);
	}
}

class TemplateText{
	constructor(text){
		this.text = text;
	}
	execute(values){
		return this.text;
	}
}

class IfExpression{
	constructor(predicate, template){
		this.predicate = predicate;
		this.template = template;
	}
	execute(values){
		var predicateValue = this.predicate.execute(values);
		if(predicateValue){
			return this.template.execute(values);
		}
		return '';
	}
}

class Template{
	constructor(parts){
		this.parts = parts;
	}
	execute(values){
		var executed = this.parts.map(function(p){return p.execute(values);});
		return executed.join('');
	}
}

class SimpleExpressionDefinition{
	constructor(expression){
		this.expression = expression;
	}
	toTemplateExpression(){
		var namesToBind = [];
		var dummyValues = [];
		var foundAll = false;
		var counter = 0;
		do{
			try{
				Function.apply(null, namesToBind.concat([this.expression])).apply(null, dummyValues);
				foundAll = true;
			}catch(e){
				var match = e.message.match(/(^\S+) is not defined/);
				if(!match){
					throw new Error(`expression ${expression} throws error: ${e.message}`);
				}
				namesToBind.push(match[1]);
				dummyValues.push(createDummyValue());
			}finally{
				counter++;
			}
		}while(!foundAll && counter < 100)
		return new TemplateExpression(this.expression, namesToBind);
	}
	getTemplatePart(){
		return this.toTemplateExpression();
	}
}

class TemplateTextDefinition{
	constructor(text){
		this.text = text;
	}
	getTemplatePart(){
		return new TemplateText(this.text);
	}
}

class IfExpressionDefinition{
	constructor(predicate, template){
		this.predicate = new SimpleExpressionDefinition(predicate);
		this.template = new TemplateDefinition(template);
	}
	getTemplatePart(){
		return new IfExpression(this.predicate.toTemplateExpression(), this.template.toTemplate());
	}
}

class TemplateDefinition{
	constructor(parts){
		this.parts = parts.map(this.mapTemplatePart.bind(this));
	}
	mapTemplatePart(part){
		switch(part.type){
			case "simple": return new SimpleExpressionDefinition(part.expression);
			case "text": return new TemplateTextDefinition(part.text);
			case "if": return new IfExpressionDefinition(part.predicate, part.template);
			default: throw new Error(`unknown template part type ${part.type}`);
		}
	}
	toTemplate(){
		return new Template(this.parts.map(function(p){return p.getTemplatePart();}));
	}
	getTemplatePart(){
		return this.toTemplate();
	}
}

var compileTemplate = async function(string){
	if(!parser){
		parser = await createParser();
	}
	var parts = parser.parse(string);
	return new TemplateDefinition(parts).toTemplate();
};

var testsPass = true;
var testCases = [
		{
			template: "{{x}} !== {{x + 1}}",
			data: {x : 2},
			expectedResult: "2 !== 3"
		},
		{
			template: "if(a % 2 == 0){{{{a}} is even}}",
			data: {a : 2},
			expectedResult: "2 !== 3"
		},
		{
			template: "and if(a % 2 == 0){{{{a}} is even}}",
			data: {a : 2},
			expectedResult: "2 !== 3"
		},
		{
			template: "{{q}} and if(a % 2 == 0){{{{a}} is even}}",
			data: {q:"yes", a : 2},
			expectedResult: "2 !== 3"
		},
		{
			template: "so {{q}} and if(a % 2 == 0){{{{a}} is even}}",
			data: {q:"yes", a : 2},
			expectedResult: "2 !== 3"
		},
		{
			template: "if(a % 2 == 0){{{{a}} is even}}{{q}}",
			data: {q:"yes", a : 2},
			expectedResult: "2 !== 3"
		},
	];
var oneIsFocussed = testCases.findIndex(function(c){return c.focussed;}) > -1;
testCases = testCases.filter(function(c){return !oneIsFocussed || c.focussed;});
var runTest = async function(testCase, fail){
	try{
		var compiled = await compileTemplate(testCase.template);
		var result = compiled.execute(testCase.data);
		console.log(result);
	}catch(e){
		fail(e.stack);
	}
};

var runTests = async function(){
	var fail = function(msg){
		console.error(`test fails: ${msg}`);
		testsPass = false;
	}
	await Promise.all(testCases.map(function(t){return runTest(t, fail);}));
};

whenTestsHaveRun = runTests();

module.exports = async function(string){
	await whenTestsHaveRun;
	console.assert(testsPass);
	return await compileTemplate(string);
};