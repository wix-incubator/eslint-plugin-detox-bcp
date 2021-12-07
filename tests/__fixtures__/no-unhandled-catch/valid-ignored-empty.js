/* eslint detox-bcp/no-unhandled-catch: ["error", { "ignorePattern": "^ignore" }] */

try {
    foo();
} catch (ignoreErr) {
    boo();
}
