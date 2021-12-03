// Forked from: https://github.com/eslint/eslint/blob/54deec56bc25d516becaf767769ee7543f491d62/lib/rules/no-unused-vars.js

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const astUtils = require("eslint/lib/rules/utils/ast-utils");

//------------------------------------------------------------------------------
// Typedefs
//------------------------------------------------------------------------------

/**
 * Bag of data used for formatting the `unusedVar` lint message.
 * @typedef {Object} UnusedVarMessageData
 * @property {string} varName The name of the unused var.
 * @property {'defined'|'assigned a value'} action Description of the vars state.
 * @property {string} additional Any additional info to be appended at the end.
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        type: "problem",

        docs: {
            description: "disallow unused errors in try-catch statements",
            category: "Variables",
            url: "https://github.com/wix-incubator/eslint-plugin-detox/blob/main/README.md"
        },

        schema: [
            {
                oneOf: [
                    {
                        type: "object",
                        properties: {
                            ignorePattern: {
                                type: "string"
                            }
                        },
                        additionalProperties: false
                    }
                ]
            }
        ],

        messages: {
            unusedVar: "'{{varName}}' error is caught but never handled{{additional}}."
        }
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        let ignorePattern;

        console.log('Something is going right', context.options);
        const [firstOption] = context.options;
        if (firstOption) {
            ignorePattern = new RegExp(firstOption.ignorePattern, "u");
        }

        /**
         * Generates the message data about the variable being defined and unused,
         * including the ignore pattern if configured.
         * @param {Variable} unusedVar eslint-scope variable object.
         * @returns {UnusedVarMessageData} The message data to be used with this unused variable.
         */
        function getDefinedMessageData(unusedVar) {
            const defType = unusedVar.defs && unusedVar.defs[0] && unusedVar.defs[0].type;

            let additional;
            if (defType === "CatchClause" && ignorePattern) {
                additional = `. Allowed unhandled exceptions must match regexp: ${ignorePattern}`;
            }

            return {
                varName: unusedVar.name,
                additional
            };
        }

        //--------------------------------------------------------------------------
        // Helpers
        //--------------------------------------------------------------------------

        const STATEMENT_TYPE = /(?:Statement|Declaration)$/u;

        /**
         * Determines if a reference is a read operation.
         * @param {Reference} ref An eslint-scope Reference
         * @returns {boolean} whether the given reference represents a read operation
         * @private
         */
        function isReadRef(ref) {
            return ref.isRead();
        }

        /**
         * Determine if an identifier is referencing an enclosing function name.
         * @param {Reference} ref The reference to check.
         * @param {ASTNode[]} nodes The candidate function nodes.
         * @returns {boolean} True if it's a self-reference, false if not.
         * @private
         */
        function isSelfReference(ref, nodes) {
            let scope = ref.from;

            while (scope) {
                if (nodes.indexOf(scope.block) >= 0) {
                    return true;
                }

                scope = scope.upper;
            }

            return false;
        }

        /**
         * Gets a list of function definitions for a specified variable.
         * @param {Variable} variable eslint-scope variable object.
         * @returns {ASTNode[]} Function nodes.
         * @private
         */
        function getFunctionDefinitions(variable) {
            const functionDefinitions = [];

            variable.defs.forEach(def => {
                const { type, node } = def;

                // FunctionDeclarations
                if (type === "FunctionName") {
                    functionDefinitions.push(node);
                }

                // FunctionExpressions
                if (type === "Variable" && node.init &&
                    (node.init.type === "FunctionExpression" || node.init.type === "ArrowFunctionExpression")) {
                    functionDefinitions.push(node.init);
                }
            });
            return functionDefinitions;
        }

        /**
         * Checks the position of given nodes.
         * @param {ASTNode} inner A node which is expected as inside.
         * @param {ASTNode} outer A node which is expected as outside.
         * @returns {boolean} `true` if the `inner` node exists in the `outer` node.
         * @private
         */
        function isInside(inner, outer) {
            return (
                inner.range[0] >= outer.range[0] &&
                inner.range[1] <= outer.range[1]
            );
        }

        /**
         * If a given reference is left-hand side of an assignment, this gets
         * the right-hand side node of the assignment.
         *
         * In the following cases, this returns null.
         *
         * - The reference is not the LHS of an assignment expression.
         * - The reference is inside of a loop.
         * - The reference is inside of a function scope which is different from
         *   the declaration.
         * @param {eslint-scope.Reference} ref A reference to check.
         * @param {ASTNode} prevRhsNode The previous RHS node.
         * @returns {ASTNode|null} The RHS node or null.
         * @private
         */
        function getRhsNode(ref, prevRhsNode) {
            const id = ref.identifier;
            const parent = id.parent;
            const grandparent = parent.parent;
            const refScope = ref.from.variableScope;
            const varScope = ref.resolved.scope.variableScope;
            const canBeUsedLater = refScope !== varScope || astUtils.isInLoop(id);

            /*
             * Inherits the previous node if this reference is in the node.
             * This is for `a = a + a`-like code.
             */
            if (prevRhsNode && isInside(id, prevRhsNode)) {
                return prevRhsNode;
            }

            if (parent.type === "AssignmentExpression" &&
                grandparent.type === "ExpressionStatement" &&
                id === parent.left &&
                !canBeUsedLater
            ) {
                return parent.right;
            }
            return null;
        }

        /**
         * Checks whether a given function node is stored to somewhere or not.
         * If the function node is stored, the function can be used later.
         * @param {ASTNode} funcNode A function node to check.
         * @param {ASTNode} rhsNode The RHS node of the previous assignment.
         * @returns {boolean} `true` if under the following conditions:
         *      - the funcNode is assigned to a variable.
         *      - the funcNode is bound as an argument of a function call.
         *      - the function is bound to a property and the object satisfies above conditions.
         * @private
         */
        function isStorableFunction(funcNode, rhsNode) {
            let node = funcNode;
            let parent = funcNode.parent;

            while (parent && isInside(parent, rhsNode)) {
                switch (parent.type) {
                    case "SequenceExpression":
                        if (parent.expressions[parent.expressions.length - 1] !== node) {
                            return false;
                        }
                        break;

                    case "CallExpression":
                    case "NewExpression":
                        return parent.callee !== node;

                    case "AssignmentExpression":
                    case "TaggedTemplateExpression":
                    case "YieldExpression":
                        return true;

                    default:
                        if (STATEMENT_TYPE.test(parent.type)) {

                            /*
                             * If it encountered statements, this is a complex pattern.
                             * Since analyzing complex patterns is hard, this returns `true` to avoid false positive.
                             */
                            return true;
                        }
                }

                node = parent;
                parent = parent.parent;
            }

            return false;
        }

        /**
         * Checks whether a given Identifier node exists inside of a function node which can be used later.
         *
         * "can be used later" means:
         * - the function is assigned to a variable.
         * - the function is bound to a property and the object can be used later.
         * - the function is bound as an argument of a function call.
         *
         * If a reference exists in a function which can be used later, the reference is read when the function is called.
         * @param {ASTNode} id An Identifier node to check.
         * @param {ASTNode} rhsNode The RHS node of the previous assignment.
         * @returns {boolean} `true` if the `id` node exists inside of a function node which can be used later.
         * @private
         */
        function isInsideOfStorableFunction(id, rhsNode) {
            const funcNode = astUtils.getUpperFunction(id);

            return (
                funcNode &&
                isInside(funcNode, rhsNode) &&
                isStorableFunction(funcNode, rhsNode)
            );
        }

        /**
         * Checks whether a given node is unused expression or not.
         * @param {ASTNode} node The node itself
         * @returns {boolean} The node is an unused expression.
         * @private
         */
        function isUnusedExpression(node) {
            const parent = node.parent;

            if (parent.type === "ExpressionStatement") {
                return true;
            }

            if (parent.type === "SequenceExpression") {
                const isLastExpression = parent.expressions[parent.expressions.length - 1] === node;

                if (!isLastExpression) {
                    return true;
                }
                return isUnusedExpression(parent);
            }

            return false;
        }

        /**
         * Checks whether a given reference is a read to update itself or not.
         * @param {eslint-scope.Reference} ref A reference to check.
         * @param {ASTNode} rhsNode The RHS node of the previous assignment.
         * @returns {boolean} The reference is a read to update itself.
         * @private
         */
        function isReadForItself(ref, rhsNode) {
            const id = ref.identifier;
            const parent = id.parent;

            return ref.isRead() && (

                // self update. e.g. `a += 1`, `a++`
                (
                    (
                        parent.type === "AssignmentExpression" &&
                        parent.left === id &&
                        isUnusedExpression(parent)
                    ) ||
                    (
                        parent.type === "UpdateExpression" &&
                        isUnusedExpression(parent)
                    )
                ) ||

                // in RHS of an assignment for itself. e.g. `a = a + 1`
                (
                    rhsNode &&
                    isInside(id, rhsNode) &&
                    !isInsideOfStorableFunction(id, rhsNode)
                )
            );
        }

        /**
         * Determine if an identifier is used either in for-in loops.
         * @param {Reference} ref The reference to check.
         * @returns {boolean} whether reference is used in the for-in loops
         * @private
         */
        function isForInRef(ref) {
            let target = ref.identifier.parent;

            // "for (var ...) { return; }"
            if (target.type === "VariableDeclarator") {
                target = target.parent.parent;
            }

            if (target.type !== "ForInStatement") {
                return false;
            }

            // "for (...) { return; }"
            if (target.body.type === "BlockStatement") {
                target = target.body.body[0];

            // "for (...) return;"
            } else {
                target = target.body;
            }

            // For empty loop body
            if (!target) {
                return false;
            }

            return target.type === "ReturnStatement";
        }

        /**
         * Determines if the variable is used.
         * @param {Variable} variable The variable to check.
         * @returns {boolean} True if the variable is used
         * @private
         */
        function isUsedVariable(variable) {
            const functionNodes = getFunctionDefinitions(variable),
                isFunctionDefinition = functionNodes.length > 0;
            let rhsNode = null;

            return variable.references.some(ref => {
                if (isForInRef(ref)) {
                    return true;
                }

                const forItself = isReadForItself(ref, rhsNode);

                rhsNode = getRhsNode(ref, rhsNode);

                return (
                    isReadRef(ref) &&
                    !forItself &&
                    !(isFunctionDefinition && isSelfReference(ref, functionNodes))
                );
            });
        }

        /**
         * Gets an array of variables without read references.
         * @param {Scope} scope an eslint-scope Scope object.
         * @param {Variable[]} unusedVars an array that saving result.
         * @returns {Variable[]} unused variables of the scope and descendant scopes.
         * @private
         */
        function collectUnusedVariables(scope, unusedVars) {
            const variables = scope.variables;
            const childScopes = scope.childScopes;
            let i, l;

            for (i = 0, l = variables.length; i < l; ++i) {
                const variable = variables[i];

                // skip a variable of class itself name in the class scope
                if (scope.type === "class" && scope.block.id === variable.identifiers[0]) {
                    continue;
                }

                // skip function expression names and variables marked with markVariableAsUsed()
                if (scope.functionExpressionScope || variable.eslintUsed) {
                    continue;
                }

                // skip implicit "arguments" variable
                if (scope.type === "function" && variable.name === "arguments" && variable.identifiers.length === 0) {
                    continue;
                }

                // explicit global variables don't have definitions.
                const [def] = variable.defs;
                if (def && def.type !== 'CatchClause') {
                    continue;
                }

                if (!isUsedVariable(variable)) {
                    unusedVars.push(variable);
                }
            }

            for (i = 0, l = childScopes.length; i < l; ++i) {
                collectUnusedVariables(childScopes[i], unusedVars);
            }

            return unusedVars;
        }

        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        return {
            "Program:exit"(programNode) {
                const unusedVars = collectUnusedVariables(context.getScope(), []);

                for (let i = 0, l = unusedVars.length; i < l; ++i) {
                    const unusedVar = unusedVars[i];

                    // Report the first declaration.
                    if (unusedVar.defs.length > 0) {
                        // report last write reference, https://github.com/eslint/eslint/issues/14324
                        const writeReferences = unusedVar.references.filter(ref => ref.isWrite() && ref.from.variableScope === unusedVar.scope.variableScope);

                        let referenceToReport;

                        if (writeReferences.length > 0) {
                            referenceToReport = writeReferences[writeReferences.length - 1];
                        }

                        context.report({
                            node: referenceToReport ? referenceToReport.identifier : unusedVar.identifiers[0],
                            messageId: "unusedVar",
                            data: getDefinedMessageData(unusedVar)
                        });
                    }
                }
            }
        };
    }
};
