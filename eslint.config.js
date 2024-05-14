const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["tsc/*.ts"],
    rules:{
        "no-console": 1,
        "@typescript-eslint/explicit-module-boundary-types": 0,
        "@typescript-eslint/ban-types": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-empty-function":0,
        "no-empty": 0,
        "@typescript-eslint/no-var-requires":0,
        "no-mixed-spaces-and-tabs": ["warn", "smart-tabs"],
        "@typescript-eslint/explicit-function-return-type":0,
        "@typescript-eslint/camelcase":0
    },
  },
  {
    ignores: ["types/*", "lib/*", "__tests__", "eslint.config.js"]
  }
);