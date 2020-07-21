var fsp = require('./fs-promise-wrapper');
var peg = require("pegjs");
var getUnboundNames = require('./get-unbound-names');

var parser = undefined;

var createParser = async function(){
	var definition = await fsp.readFile('./parser-definition.peg', 'utf8');
	return peg.generate(definition);
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
		var namesToBind = getUnboundNames(this.expression);
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

module.exports = compileTemplate;