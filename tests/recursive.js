import ParserToolkit from '../src/lib';

import chai from 'chai';
const assert = chai.assert;

suite('Recursive Test Suite', () => {
    const parser = new ParserToolkit();
    const plugin = parser.createPlugin({
        name: 'TestCaseRecurisve',
    });

    suiteSetup(() => {
        // create some test tokens
        const IF = plugin.createToken({
            name: 'if',
            expression: 'if',
        }).get();

        const PO = plugin.createToken({
            name: 'po',
            expression: '(',
        }).get();

        const PE = plugin.createToken({
            name: 'pe',
            expression: ')',
        }).get();

        const EQ = plugin.createToken({
            name: 'eq',
            expression: '==',
        }).get();

        const AND = plugin.createToken({
            name: 'and',
            expression: '&&',
        }).get();

        const IDENT = plugin.createToken({
            name: 'ident',
            expression: /^[a-zA-Z]*$/,
        }).get();

        // expression holder
        const EXPR = plugin.createHolder({
            name: 'expr',
            filter(t) {
                return (t.name === 'eq' ||
                    t.name === 'and' ||
                    t.name === 'ident');
            },
            precedence: [
                ['left', ['eq']],
                ['left', ['and']],
            ],
            maxElements: 1,
        }).get();

        // create base grammars
        plugin.createGrammar({
            root: false,
            name: 'and',
            grammar: `${EXPR} ${AND} ${EXPR}`,
            parsed(tokens, children) {
                return {
                    name: 'and',
                    left: children[0].parse()[0],
                    right: children[1].parse()[0],
                };
            }
        });

        plugin.createGrammar({
            root: false,
            name: 'eq',
            grammar: `${EXPR} ${EQ} ${EXPR}`,
            parsed(tokens, children) {
                return {
                    name: 'eq',
                    left: children[0].parse()[0],
                    right: children[1].parse()[0],
                };
            }
        });

        plugin.createGrammar({
            root: false,
            name: 'ident',
            grammar: `${IDENT}:val`,
            parsed(tokens, children) {
                return {
                    name: 'ident',
                    value: tokens.val.value,
                };
            }
        });

        plugin.createGrammar({
            name: 'if',
            grammar: `${IF} ${PO} ${EXPR} ${PE}`,
            parsed(tokens, children) {
                return {
                    name: 'if',
                    expr: children[0].parse()[0],
                };
            }
        });
    });

    const expected = [
        // on level down checks
        ['should parse', 'if (abc)', { name: 'if', expr: { name: 'ident', value: 'abc' } }],
        ['should parse', 'if (a && b)', {
            name: 'if',
            expr: {
                name: 'and',
                left: { name: 'ident', value: 'a' },
                right: { name: 'ident', value: 'b'},
            }
        }],
        ['should parse', 'if (a == b)', {
            name: 'if',
            expr: {
                name: 'eq',
                left: { name: 'ident', value: 'a' },
                right: { name: 'ident', value: 'b'},
            }
        }],
        ['should parse multi levels and apply precendence', 'if (a == b && c == d)', {
            name: 'if',
            expr: {
                name: 'and',
                left: {
                    name: 'eq',
                    left: { name: 'ident', value: 'a' },
                    right: { name: 'ident', value: 'b'},
                },
                right: {
                    name: 'eq',
                    left: { name: 'ident', value: 'c' },
                    right: { name: 'ident', value: 'd'},
                },
            },
        }]
    ];

    expected.forEach(ex => {
        test(`${ex[0]}: '${ex[1]}'`, () => {
            let t = parser.parse('\n\n' + ex[1] + '\n\n')[0];
            assert.deepEqual(t, ex[2]);
        });
    });

});