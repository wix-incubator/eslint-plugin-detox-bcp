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
 * Returns an expected error for try {} catch {} optional error binding.
 * @returns {Object} An expected error object
 */
function noOptionalCatchBindingError() {
    return {
        messageId: "noOptionalCatchBindingError",
        data: {},
        type: "CatchClause"
    };
}

ruleTester.run("no-unhandled-catch", rule, {
    valid: [
        "try{}catch(err){console.error(err);}",
        {
            code: "try{}catch(ignoreErr){}",
            options: [{ ignorePattern: "^ignore" }]
        },
        "for (;;) { try {} catch (err) { err.toString(); } }",
        "function main() { try { a.b; } catch (err) { err.toString(); } }",
        {
            code: "class A { foo() { try{} catch(err) {console.error(err);} } }",
            parserOptions: { ecmaVersion: 6 },
        },
        "try { try { a.b; } catch(e2) { throw e2; } } catch (e1) { throw e1; }",
        {
            code: "try{}catch(err){for (var k in err) {}};",
            errors: [definedError("err")]
        },
    ],
    invalid: [
        {
            code: "try{}catch{};",
            parserOptions: { ecmaVersion: 2019 },
            errors: [noOptionalCatchBindingError()]
        },
        {
            code: "try{}catch(err){ try{}catch(err){throw err}}",
            errors: [definedError("err")]
        },
        {
            code: "try{}catch(err){};",
            errors: [definedError("err")]
        },
        {
            code: "try{}catch(err){err++}",
            errors: [definedError("err")]
        },
        {
            code: "try{}catch(err){err+=err}",
            errors: [definedError("err")]
        },
        {
            code: "try{}catch(err){err=err.toString()};",
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
    ]
});
