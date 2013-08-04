var grammarText = 
	"S:					STMTS\n" +
	"STMTS:				STMT STMTS | e\n" +
	"STMT:				IF_STMT | FN_CALL_STMT\n" +
	"IF_STMT:			if ( BOOL_EXPR ) { STMTS }\n" +
	"FN_CALL_STMT:		action1() | action2() | action3()\n" +
	"BOOL_EXPR:			VAR COMPARISON_OP NUM_VALUE | true | false\n" +
	"NUM_VALUE:			DIGIT DIGITS | VAR\n" +
	"DIGITS:			DIGIT DIGITS | e\n" +
	"DIGIT:				0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9\n" +
	"COMPARISON_OP:		== | > | < | >= | <=\n" +
	"VAR:				a | b | c\n";

var grammar = {}, lines = grammarText.split('\n');

lines.forEach(function(line){
	if (line) {
		var parts = line.split(':'),
			nonTerminal = parts.shift(':').trim(),
			substitutions = parts.join(':').trim();

		grammar[nonTerminal] = substitutions.split('|').
				map(function(s){ return s.trim(); }).
				map(function(s){ return s.split(' ').
					map(function(s){ return s.trim();})
				});
	}
});

function buildNonTerminal(name) {
	return {name : name, isTerminal : false};
}
function buildTerminal(name) {
	return {name : name, isTerminal : true};
}

Object.keys(grammar).forEach(function(nonTerminal) {
	grammar[nonTerminal] = grammar[nonTerminal].map(function(substitution) {
		return substitution.map(function(symbol) {
			return ((symbol in grammar) ? buildNonTerminal : buildTerminal)(symbol);
		});
	});
});

console.log(grammar);

