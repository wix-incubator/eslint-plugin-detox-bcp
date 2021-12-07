"use strict";

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    "eslint:recommended",
    "plugin:eslint-plugin/recommended",
    "plugin:node/recommended",
    "plugin:editorconfig/all"
  ],
  plugins: [
    "editorconfig"
  ],
  env: {
    node: true,
  },
  overrides: [
    {
      files: ["tests/**/*"],
      env: { jest: true }
    },
  ],
};
