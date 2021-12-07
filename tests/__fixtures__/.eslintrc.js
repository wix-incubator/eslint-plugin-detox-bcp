module.exports = {
    root: true,
    plugins: ['detox-bcp'],
    overrides: [
        {
            files: ['no-unhandled-catch/*'],
            rules: { 'detox-bcp/no-unhandled-catch': 'error' },
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
