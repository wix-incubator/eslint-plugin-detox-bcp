// Forked from: https://github.com/eslint/eslint/blob/54deec56bc25d516becaf767769ee7543f491d62/lib/rules/no-unused-vars.js

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const astUtils = require("./utils/ast-utils");

//------------------------------------------------------------------------------
// Typedefs
//------------------------------------------------------------------------------

/**
 * Bag of data used for formatting the `unhandledError` lint message.
 * @typedef {Object} UnusedVarMessageData
 * @property {string} errorName The name of the unhandled error.
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
            unhandledError: "'{{errorName}}' error is caught but never handled{{additional}}.",
            noOptionalCatchBindingError: "Optional catch binding is disallowed, please handle the caught error."
        }
    },

    create(context) {
        let ignorePattern;

        const [firstOption] = context.options;
        if (firstOption) {
            ignorePattern = new RegExp(firstOption.ignorePattern, "u");
        }

        /**
         * Generates the message data about the variable being defined and unused,
         * including the ignore pattern if configured.
         * @param {Variable} unhandledError eslint-scope variable object.
         * @returns {UnusedVarMessageData} The message data to be used with this unhandled error.
         */
        function getDefinedMessageData(unhandledError) {
            const defType = unhandledError.defs && unhandledError.defs[0] && unhandledError.defs[0].type;

            let additional = '';
            if (defType === "CatchClause" && ignorePattern) {
                additional = `. Allowed unhandled exceptions must match regexp: ${ignorePattern}`;
            }

            return {
                errorName: unhandledError.name,
                additional
            };
        }

        //--------------------------------------------------------------------------
        // Helpers
        //--------------------------------------------------------------------------

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
                    isInside(id, rhsNode)
                )
            );
        }

        /**
         * Determines if the variable is used.
         * @param {Variable} variable The variable to check.
         * @returns {boolean} True if the variable is used
         * @private
         */
        function isUsedVariable(variable) {
            let rhsNode = null;
            let forItself = null;

            return variable.references.some(ref => {
                forItself = isReadForItself(ref, rhsNode);
                rhsNode = getRhsNode(ref, rhsNode);
                return (isReadRef(ref) && !forItself && true);
            });
        }

        function isUnhandledError(errorVar) {
            if (!errorVar) {
                return;
            }

            const [def] = errorVar.defs;
            if (ignorePattern && ignorePattern.test(def.name.name)) {
                return;
            }

            return !isUsedVariable(errorVar);
        }

        function collectUnhandledErrors(scope, unhandledErrors) {
            if (scope.type === 'catch') {
                const errorVar = scope.variables[0];
                if (isUnhandledError(errorVar)) {
                    unhandledErrors.push(errorVar);
                }
            }

            let i, l;
            const { childScopes } = scope;
            for (i = 0, l = childScopes.length; i < l; ++i) {
                collectUnhandledErrors(childScopes[i], unhandledErrors);
            }

            return unhandledErrors;
        }

        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        return {
            "CatchClause:exit"(catchNode) {
                if (!catchNode.param) {
                    context.report({
                        node: catchNode,
                        messageId: "noOptionalCatchBindingError",
                    });
                }
            },
            "Program:exit"() {
                const unhandledErrors = collectUnhandledErrors(context.getScope(), []);

                for (let i = 0, l = unhandledErrors.length; i < l; ++i) {
                    const unhandledError = unhandledErrors[i];

                    // Report the first declaration.
                    if (unhandledError.defs.length > 0) {
                        // report last write reference, https://github.com/eslint/eslint/issues/14324
                        const writeReferences = unhandledError.references.filter(ref => {
                            return ref.isWrite() && ref.from.variableScope === unhandledError.scope.variableScope;
                        });

                        let referenceToReport;
                        if (writeReferences.length > 0) {
                            referenceToReport = writeReferences[writeReferences.length - 1];
                        }

                        context.report({
                            node: referenceToReport ? referenceToReport.identifier : unhandledError.identifiers[0],
                            messageId: "unhandledError",
                            data: getDefinedMessageData(unhandledError)
                        });
                    }
                }
            }
        };
    }
};
