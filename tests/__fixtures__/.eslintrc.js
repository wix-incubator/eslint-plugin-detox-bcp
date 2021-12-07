module.exports = {
    root: true,
    plugins: ['detox'],
    overrides: [
        {
            files: ['no-unhandled-catch/*'],
            rules: { 'detox/no-unhandled-catch': 'error' },
        },
        {
            files: ['*.es6.js'],
            parserOptions: { ecmaVersion: 6 },
        },
        {
            files: ['*.es2019.js'],
            parserOptions: { ecmaVersion: 2019 },
        },
    ]
};
