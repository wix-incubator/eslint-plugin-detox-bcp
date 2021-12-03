# eslint-plugin-detox

Contains ESLint rules that may enforce best Detox practices.

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-detox`:

```sh
npm install eslint-plugin-detox --save-dev
```

## Usage

Add `detox` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "detox"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "detox/no-unhandled-errors": 2
    }
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
