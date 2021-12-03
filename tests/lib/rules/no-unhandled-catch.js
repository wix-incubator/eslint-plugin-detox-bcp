// Forked from: https://github.com/eslint/eslint/blob/54deec56bc25d516becaf767769ee7543f491d62/tests/lib/rules/no-unused-vars.js

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-unhandled-catch"),
    { RuleTester } = require("eslint/lib/rule-tester");

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester();

ruleTester.defineRule("use-every-a", context => {

    /**
     * Mark a variable as used
     * @returns {void}
     * @private
     */
    function useA() {
        context.markVariableAsUsed("a");
    }
    return {
        VariableDeclaration: useA,
        ReturnStatement: useA
    };
});

/**
 * Returns an expected error for defined-but-not-used variables.
 * @param {string} errorName The name of the variable
 * @param {string} [additional] The additional text for the message data
 * @param {string} [type] The node type (defaults to "Identifier")
 * @returns {Object} An expected error object
 */
function definedError(errorName, additional = "", type = "Identifier") {
    return {
        messageId: "unhandledError",
        data: {
            errorName,
            action: "defined",
            additional
        },
        type
    };
}

/**
 * Returns an expected error for assigned-but-not-used variables.
 * @param {string} varName The name of the variable
 * @param {string} [additional] The additional text for the message data
 * @param {string} [type] The node type (defaults to "Identifier")
 * @returns {Object} An expected error object
 */
function assignedError(varName, additional = "", type = "Identifier") {
    return {
        messageId: "unusedVar",
        data: {
            varName,
            action: "assigned a value",
            additional
        },
        type
    };
}

ruleTester.run("no-unused-vars", rule, {
    valid: [
        "var foo = 5;\n\nlabel: while (true) {\n  console.log(foo);\n  break label;\n}",
        "var foo = 5;\n\nwhile (true) {\n  console.log(foo);\n  break;\n}",
        { code: "for (let prop in box) {\n        box[prop] = parseInt(box[prop]);\n}", parserOptions: { ecmaVersion: 6 } },
        "var box = {a: 2};\n    for (var prop in box) {\n        box[prop] = parseInt(box[prop]);\n}",
        "f({ set foo(a) { return; } });",
        { code: "a; var a;" },
        { code: "var a=10; alert(a);" },
        { code: "var a=10; (function() { alert(a); })();" },
        { code: "var a=10; (function() { setTimeout(function() { alert(a); }, 0); })();" },
        { code: "var a=10; d[a] = 0;" },
        { code: "(function() { var a=10; return a; })();" },
        { code: "(function g() {})()" },
        { code: "function f(a) {alert(a);}; f();" },
        { code: "var c = 0; function f(a){ var b = a; return b; }; f(c);" },
        { code: "function a(x, y){ return y; }; a();" },
        { code: "var arr1 = [1, 2]; var arr2 = [3, 4]; for (var i in arr1) { arr1[i] = 5; } for (var i in arr2) { arr2[i] = 10; }" },
        { code: "var a=10;" },
        { code: "var min = \"min\"; Math[min];" },
        { code: "Foo.bar = function(baz) { return baz; };" },
        "myFunc(function foo() {}.bind(this))",
        "myFunc(function foo(){}.toString())",
        "function foo(first, second) {\ndoStuff(function() {\nconsole.log(second);});}; foo()",
        "(function() { var doSomething = function doSomething() {}; doSomething() }())",
        "/*global a */ a;",
        { code: "var a=10; (function() { alert(a); })();" },
        { code: "function g(bar, baz) { return baz; }; g();" },
        { code: "function g(bar, baz) { return baz; }; g();" },
        { code: "function g(bar, baz) { return bar; }; g();" },
        { code: "function g(bar, baz) { return 2; }; g();" },
        { code: "function g(bar, baz) { return bar + baz; }; g();" },
        { code: "var g = function(bar, baz) { return 2; }; g();" },
        "(function z() { z(); })();",
        { code: " ", globals: { a: true } },
        { code: "var who = \"Paul\";\nmodule.exports = `Hello ${who}!`;", parserOptions: { ecmaVersion: 6 } },
        { code: "export var foo = 123;", parserOptions: { ecmaVersion: 6, sourceType: "module" } },
        { code: "export function foo () {}", parserOptions: { ecmaVersion: 6, sourceType: "module" } },
        { code: "let toUpper = (partial) => partial.toUpperCase; export {toUpper}", parserOptions: { ecmaVersion: 6, sourceType: "module" } },
        { code: "export class foo {}", parserOptions: { ecmaVersion: 6, sourceType: "module" } },
        { code: "class Foo{}; var x = new Foo(); x.foo()", parserOptions: { ecmaVersion: 6 } },
        { code: "const foo = \"hello!\";function bar(foobar = foo) {  foobar.replace(/!$/, \" world!\");}\nbar();", parserOptions: { ecmaVersion: 6 } },
        "function Foo(){}; var x = new Foo(); x.foo()",
        "function foo() {var foo = 1; return foo}; foo();",
        "function foo(foo) {return foo}; foo(1);",
        "function foo() {function foo() {return 1;}; return foo()}; foo();",
        { code: "function foo() {var foo = 1; return foo}; foo();", parserOptions: { parserOptions: { ecmaVersion: 6 } } },
        { code: "function foo(foo) {return foo}; foo(1);", parserOptions: { parserOptions: { ecmaVersion: 6 } } },
        { code: "function foo() {function foo() {return 1;}; return foo()}; foo();", parserOptions: { parserOptions: { ecmaVersion: 6 } } },
        { code: "const x = 1; const [y = x] = []; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = 1; const {y = x} = {}; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = 1; const {z: [y = x]} = {}; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = []; const {z: [y] = x} = {}; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = 1; let y; [y = x] = []; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = 1; let y; ({z: [y = x]} = {}); foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = []; let y; ({z: [y] = x} = {}); foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = 1; function foo(y = x) { bar(y); } foo();", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = 1; function foo({y = x} = {}) { bar(y); } foo();", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = 1; function foo(y = function(z = x) { bar(z); }) { y(); } foo();", parserOptions: { ecmaVersion: 6 } },
        { code: "const x = 1; function foo(y = function() { bar(x); }) { y(); } foo();", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = 1; var [y = x] = []; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = 1; var {y = x} = {}; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = 1; var {z: [y = x]} = {}; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = []; var {z: [y] = x} = {}; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = 1, y; [y = x] = []; foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = 1, y; ({z: [y = x]} = {}); foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = [], y; ({z: [y] = x} = {}); foo(y);", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = 1; function foo(y = x) { bar(y); } foo();", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = 1; function foo({y = x} = {}) { bar(y); } foo();", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = 1; function foo(y = function(z = x) { bar(z); }) { y(); } foo();", parserOptions: { ecmaVersion: 6 } },
        { code: "var x = 1; function foo(y = function() { bar(x); }) { y(); } foo();", parserOptions: { ecmaVersion: 6 } },

        // exported variables should work
        "/*exported toaster*/ var toaster = 'great'",
        "/*exported toaster, poster*/ var toaster = 1; poster = 0;",
        { code: "/*exported x*/ var { x } = y", parserOptions: { ecmaVersion: 6 } },
        { code: "/*exported x, y*/  var { x, y } = z", parserOptions: { ecmaVersion: 6 } },

        // Can mark variables as used via context.markVariableAsUsed()
        "/*eslint use-every-a:1*/ var a;",
        "/*eslint use-every-a:1*/ !function(a) { return 1; }",
        "/*eslint use-every-a:1*/ !function() { var a; return 1 }",

        // ignore pattern
        { code: "var _a;" },
        { code: "var a; function foo() { var _b; } foo();" },
        { code: "function foo(_a) { } foo();" },
        { code: "function foo(a, _b) { return a; } foo();" },
        { code: "var [ firstItemIgnored, secondItem ] = items;\nconsole.log(secondItem);", parserOptions: { ecmaVersion: 6 } },

        // for-in loops (see #2342)
        "(function(obj) { var name; for ( name in obj ) return; })({});",
        "(function(obj) { var name; for ( name in obj ) { return; } })({});",
        "(function(obj) { for ( var name in obj ) { return true } })({})",
        "(function(obj) { for ( var name in obj ) return true })({})",

        { code: "(function(obj) { let name; for ( name in obj ) return; })({});", parserOptions: { ecmaVersion: 6 } },
        { code: "(function(obj) { let name; for ( name in obj ) { return; } })({});", parserOptions: { ecmaVersion: 6 } },
        { code: "(function(obj) { for ( let name in obj ) { return true } })({})", parserOptions: { ecmaVersion: 6 } },
        { code: "(function(obj) { for ( let name in obj ) return true })({})", parserOptions: { ecmaVersion: 6 } },

        { code: "(function(obj) { for ( const name in obj ) { return true } })({})", parserOptions: { ecmaVersion: 6 } },
        { code: "(function(obj) { for ( const name in obj ) return true })({})", parserOptions: { ecmaVersion: 6 } },

        // Sequence Expressions (See https://github.com/eslint/eslint/issues/14325)
        { code: "let x = 0; foo = (0, x++);", parserOptions: { ecmaVersion: 6 } },
        { code: "let x = 0; foo = (0, x += 1);", parserOptions: { ecmaVersion: 6 } },
        { code: "let x = 0; foo = (0, x = x + 1);", parserOptions: { ecmaVersion: 6 } },

        // caughtErrors
        "try{}catch(err){console.error(err);}",
        {
            code: "try{}catch(ignoreErr){}",
            options: [{ ignorePattern: "^ignore" }]
        },

        // https://github.com/eslint/eslint/issues/6348
        "var a = 0, b; b = a = a + 1; foo(b);",
        "var a = 0, b; b = a += a + 1; foo(b);",
        "var a = 0, b; b = a++; foo(b);",
        "function foo(a) { var b = a = a + 1; bar(b) } foo();",
        "function foo(a) { var b = a += a + 1; bar(b) } foo();",
        "function foo(a) { var b = a++; bar(b) } foo();",

        // https://github.com/eslint/eslint/issues/6576
        [
            "var unregisterFooWatcher;",
            "// ...",
            "unregisterFooWatcher = $scope.$watch( \"foo\", function() {",
            "    // ...some code..",
            "    unregisterFooWatcher();",
            "});"
        ].join("\n"),
        [
            "var ref;",
            "ref = setInterval(",
            "    function(){",
            "        clearInterval(ref);",
            "    }, 10);"
        ].join("\n"),
        [
            "var _timer;",
            "function f() {",
            "    _timer = setTimeout(function () {}, _timer ? 100 : 0);",
            "}",
            "f();"
        ].join("\n"),
        "function foo(cb) { cb = function() { function something(a) { cb(1 + a); } register(something); }(); } foo();",
        { code: "function* foo(cb) { cb = yield function(a) { cb(1 + a); }; } foo();", parserOptions: { ecmaVersion: 6 } },
        { code: "function foo(cb) { cb = tag`hello${function(a) { cb(1 + a); }}`; } foo();", parserOptions: { ecmaVersion: 6 } },
        "function foo(cb) { var b; cb = b = function(a) { cb(1 + a); }; b(); } foo();",

        // https://github.com/eslint/eslint/issues/6646
        [
            "function someFunction() {",
            "    var a = 0, i;",
            "    for (i = 0; i < 2; i++) {",
            "        a = myFunction(a);",
            "    }",
            "}",
            "someFunction();"
        ].join("\n"),

        // https://github.com/eslint/eslint/issues/7351
        {
            code: "(class { set foo(UNUSED) {} })",
            parserOptions: { ecmaVersion: 6 }
        },
        {
            code: "class Foo { set bar(UNUSED) {} } console.log(Foo)",
            parserOptions: { ecmaVersion: 6 }
        },

        // https://github.com/eslint/eslint/issues/10952
        "/*eslint use-every-a:1*/ !function(b, a) { return 1 }",

        // https://github.com/eslint/eslint/issues/10982
        "var a = function () { a(); }; a();",
        "var a = function(){ return function () { a(); } }; a();",
        {
            code: "const a = () => { a(); }; a();",
            parserOptions: { ecmaVersion: 2015 }
        },
        {
            code: "const a = () => () => { a(); }; a();",
            parserOptions: { ecmaVersion: 2015 }
        },

        // export * as ns from "source"
        {
            code: 'export * as ns from "source"',
            parserOptions: { ecmaVersion: 2020, sourceType: "module" }
        },

        // import.meta
        {
            code: "import.meta",
            parserOptions: { ecmaVersion: 2020, sourceType: "module" }
        }
    ],
    invalid: [
        // caughtErrors
        {
            code: "try{}catch(err){};",
            errors: [definedError("err")]
        },
        {
            code: "try{}catch(err){};",
            options: [{ ignorePattern: "^ignore" }],
            errors: [definedError("err", ". Allowed unhandled exceptions must match regexp: /^ignore/u")]
        },

        // multiple try catch with one success
        {
            code: "try{}catch(ignoreErr){}try{}catch(err){};",
            options: [{ ignorePattern: "^ignore" }],
            errors: [definedError("err", ". Allowed unhandled exceptions must match regexp: /^ignore/u")]
        },

        // multiple try catch both fail
        {
            code: "try{}catch(error){}try{}catch(err){};",
            options: [{ ignorePattern: "^ignore" }],
            errors: [
                definedError("error", ". Allowed unhandled exceptions must match regexp: /^ignore/u"),
                definedError("err", ". Allowed unhandled exceptions must match regexp: /^ignore/u")
            ]
        },

        // caughtErrors with other configs
        {
            code: "try{}catch(err){};",
            errors: [definedError("err")]
        },
    ]
});
