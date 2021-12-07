"use strict";

module.exports.rules = {
  'no-unhandled-catch': require('./rules/no-unhandled-catch'),
};

module.exports.configs = {
  all: {
    rules: {
      'detox-bcp/no-unhandled-catch': 'error',
    },
  },
};
