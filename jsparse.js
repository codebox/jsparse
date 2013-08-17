"use strict";

/*
TODO
 - flag suspicious terminals (upper case words)
 - reported error location wrong when input does not conform to grammar
*/

var grammarText =
        "S:        STMTS\n" +
        "STMTS:    STMT STMTS\n" +
        "STMTS:    \n" +
        "STMT:     FUNCTION\n" +
        "STMT:     COMMENT\n" +
        "STMT:     STRING\n" +
        "STMT:     OTHER\n" +
        "FUNCTION: function[()][)][{] STMTS [}]\n" +
        "OTHER:    [a-zA-Z0-9_]+\n" +
        "COMMENT:  /[*] ([^*]|\\*[^/])* [*]/\n" +
        "STRING:   \"[^\"]*\"";


function buildGrammar(grammarText){
    var grammar = {}, lines = grammarText.split('\n');

    lines.forEach(function(line){
        if (line) {
            var parts = line.split(':'),
                nonTerminal = parts.shift(':').trim(),
                substitution = parts.join(':').trim();

            if (!grammar[nonTerminal]){
                grammar[nonTerminal] = [];
            }
            grammar[nonTerminal].push(substitution.split(' ').map(function(s){ return s.trim();}));
        }
    });

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
                    //console.log('consumed non terminal [' + input + '] ' + this.name + ' ' + mostCharsMatched);
                    nonTerminalName = this.name;
                    return makeParseResult(mostCharsMatched, {symbol : nonTerminalName, text : input.substr(0, mostCharsMatched), children : parseTreeFragment});
                }
            }
        };
    }
    function buildTerminal(text) {
        var regex = new RegExp("^\\s*" + text);
        return {
            text : regex,
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
document.getElementById('code').innerHTML = 'function(){\n    function(){\n        some code here\n    }\n}';

document.getElementById('go').onclick = function(){
    var grammarText = document.getElementById('grammar').value,
        grammar = buildGrammar(grammarText),
        input = document.getElementById('code').value,
        output = document.getElementById('output'),
        result = document.getElementById('result'),
        tree = grammar['S'][0][0].consume(input);
    console.log(grammar);

    if (tree.charsConsumed === input.length){
        result.innerHTML = 'Parsed ok';
        result.className = 'ok';
    } else {
        result.innerHTML = 'Parse error after ' + tree.charsConsumed + ' characters';
        result.className = 'error';
    }
    output.innerHTML = print(tree).join('<br>');
};

