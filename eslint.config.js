export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "coverage/**", "tests/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        chrome: "readonly",
        URL: "readonly",
        Blob: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "eqeqeq": ["error", "always"],
      "no-eval": "error",
      "prefer-const": "warn",
      "no-var": "error"
    }
  }
];
