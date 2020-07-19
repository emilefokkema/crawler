class BlockMatcher{
	constructor(openBlockPattern, closeBlockPattern){
		this.openBlockPattern = openBlockPattern;
		this.closeBlockPattern = closeBlockPattern;
	}
	replace(input, replaceBlockFn, replaceOutsideFn){
		var openBlockRegex = new RegExp(`^${this.openBlockPattern}$`);
		var openOrCloseRegex = new RegExp(`(?:${this.openBlockPattern}|${this.closeBlockPattern})`, "g");
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
	}
}

var matcher = new BlockMatcher("\\(", "\\)");
console.assert(matcher.replace("0()(4(6))9", function(open, block, close){return '[]';}, function(outside){return outside;}) === "0[][]9");
console.assert(matcher.replace("(0(4(6))9)", function(open, block, close){return '[]';}, function(outside){return outside;}) === "[]");
console.assert(matcher.replace("0(4(6))9", function(open, block, close){return '[]';}, function(outside){return outside;}) === "0[]9");
console.assert(matcher.replace("1(0(4(6))9)", function(open, block, close){return '[]';}, function(outside){return outside;}) === "1[]");
console.assert(matcher.replace("(0(4(6))9)1", function(open, block, close){return '[]';}, function(outside){return outside;}) === "[]1");

module.exports = BlockMatcher;