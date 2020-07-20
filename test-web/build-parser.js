var fsp = require('./fs-promise-wrapper');
var peg = require("pegjs");

(async function(){
	var definition = await fsp.readFile('./parser-definition.peg', 'utf8');
	var parser = peg.generate(definition);

	var templateStrings = [
		"a {{b}} c",
		"if(a){{a {{b}} c}}",
		"{{x}} !== {{x + 1}}"
	];

	for(var i = 0; i < templateStrings.length; i++){
		var result = parser.parse(templateStrings[i]);
		console.log(JSON.stringify(result));
	}
})();