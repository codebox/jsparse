"use strict";

var grammarText =
        "S:              STMTS\n" +
        "STMTS:          STMT STMTS | \n" +
        "STMT:           IF_STMT | FN_CALL_STMT\n" +
        "IF_STMT:        if ( BOOL_EXPR ) { STMTS }\n" +
        "FN_CALL_STMT:   action1() | action2() | action3()\n" +
        "BOOL_EXPR:      VAR COMPARISON_OP NUM_VALUE | true | false\n" +
        "NUM_VALUE:      DIGIT DIGITS | VAR\n" +
        "DIGITS:         DIGIT DIGITS | \n" +
        "DIGIT:          0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9\n" +
        "COMPARISON_OP:  == | > | < | >= | <=\n" +
        "VAR:            a | b | c\n";

function buildGrammar(grammarText){
    var grammar = {}, lines = grammarText.split('\n');

    lines.forEach(function(line){
        if (line) {
            var parts = line.split(':'),
                nonTerminal = parts.shift(':').trim(),
                substitutions = parts.join(':').trim();

            grammar[nonTerminal] = substitutions.split('|').
                map(function(s){ return s.trim(); }).
                map(function(s){ return s.split(' ').
                    map(function(s){ return s.trim();});
                });
        }
    });

    function escape(s){
        return s.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
    }

    function makeParseResult(charsConsumed, parseTreeFragment){
        return {
            charsConsumed : charsConsumed,
            parseTreeFragment : parseTreeFragment
        };
    }

    function buildNonTerminal(name) {
        return {
            name : name,
            isTerminal : false,
            consume : function(input){
                var matched = false, mostCharsMatched = 0, parseTreeFragment = [], nonTerminalName;
                grammar[this.name].forEach(function(alternative){
                    var remainingInput = input, matchedTokens = [], charsMatched,
                        matchesOk = alternative.every(function(symbol){
                            var result = symbol.consume(remainingInput);
                            if (result){
                                remainingInput = remainingInput.substr(result.charsConsumed);
                                matchedTokens.push(result);
                                return true;
                            } 
                            return false;
                        });

                    if (matchesOk){
                        matched = true;
                        charsMatched = input.length - remainingInput.length;
                        if (charsMatched > mostCharsMatched){
                            mostCharsMatched = charsMatched;
                            parseTreeFragment = matchedTokens;
                        }
                    }
                });

                if (matched){
                    nonTerminalName = this.name;
                    return makeParseResult(mostCharsMatched, {symbol : nonTerminalName, text : input.substr(0, mostCharsMatched), children : parseTreeFragment});
                }
            }
        };
    }
    function buildTerminal(text) {
        var regex = new RegExp("^\\s*" + escape(text));
        return {
            text : text,
            isTerminal : true,
            consume : function(input){
                var match = regex.exec(input), matchText;
                if (match){
                    matchText = match[0];
                    return makeParseResult(matchText.length, matchText);
                }
            }
        };
    }

    Object.keys(grammar).forEach(function(nonTerminal) {
        grammar[nonTerminal] = grammar[nonTerminal].map(function(substitution) {
            return substitution.map(function(symbol) {
                return ((symbol in grammar) ? buildNonTerminal : buildTerminal)(symbol);
            });
        });
    });
    return grammar;
}


var print = (function(){
    function indent(n){
        return new Array(n+1).join('  ');
    }

    return function (result, level){
        var text = [];
        level = level || 0;
        if (typeof result.parseTreeFragment === "string"){
            text.push(indent(level) + result.parseTreeFragment.trim());
        } else {
            text.push(indent(level) + result.parseTreeFragment.symbol);
            result.parseTreeFragment.children.forEach(function(child){
                text = text.concat(print(child, level + 1));
            });
        }
        return text;
    };
}());

document.getElementById('grammar').innerHTML = grammarText;
document.getElementById('code').innerHTML = 'if(a<5){action1()}';

document.getElementById('go').onclick = function(){
    var grammarText = document.getElementById('grammar').value,
        grammar = buildGrammar(grammarText),
        input = document.getElementById('code').value,
        output = document.getElementById('output'),
        tree = grammar['S'][0][0].consume(input);

    output.innerHTML = print(tree).join('<br>');
};

