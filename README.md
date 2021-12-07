# eslint-plugin-detox-bcp

Contains ESLint rules that may enforce current best practices for Detox.

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-detox-bcp`:

```sh
npm install eslint-plugin-detox-bcp --save-dev
```

## Usage

Add `detox` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "detox-bcp"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "detox-bcp/no-unhandled-errors": "error"
    }
}
```

or just use:


```json
{
    "extends": [
        "plugin:detox-bcp/all"
    ]
}
```

## Supported Rules

### detox/no-unhandled-errors

Prevents situations where the test writer always treats a caught error as a failed expectation or element action:

```js
try {
  await myTestDriver.tapOnNewButton();
} catch (e) {
  // what if `e` is a SyntaxError or anything else?
  await myTestDriver.tapOnOldButton();
}
```

The rule enforces handling of the caught errors, e.g.:

```js
try {
  await myTestDriver.tapOnNewButton();
} catch (e) {
  if (!`${e}`.match(/^DetoxRuntimeError.*visible/)) {
    throw e;
  }

  await myTestDriver.tapOnOldButton();
}
```
