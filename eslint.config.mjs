/* eslint-env node */
"use strict";

import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
      },
      globals: {
        ...globals.node,
      },
    },
    files: ["**/*.js"],
    rules: {
      "consistent-return": 2,
      "no-dupe-args": 2,
      "no-dupe-keys": 2,
      "no-duplicate-case": 2,
      "no-labels": 2,
      "no-else-return": 2,
      "no-empty": 2,
      "no-empty-character-class": 2,
      "no-empty-pattern": 2,
      "no-func-assign": 2,
      "no-inner-declarations": 2,
      "no-invalid-regexp": 2,
      "no-irregular-whitespace": 2,
      "no-lonely-if": 2,

      "no-native-reassign": 2,
      "no-negated-in-lhs": 2,
      "no-nested-ternary": 2,
      "no-obj-calls": 2,
      "no-octal": 2,
      "no-redeclare": 2,
      "no-self-compare": 2,
      "no-shadow": 2,
      "no-shadow-restricted-names": 2,
      "no-undef": 2,
      "no-unreachable": 2,

      "no-unused-vars": [
        2,
        {
          vars: "all",
          args: "none",
        },
      ],

      // "no-use-before-define": [2, "nofunc"],
      "no-with": 2,
      "use-isnan": 2,
      "valid-typeof": 2,
    },
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        it: "readonly",
        describe: "readonly",
        before: "readonly",
      },
    },
  },
  eslintConfigPrettier,
];
