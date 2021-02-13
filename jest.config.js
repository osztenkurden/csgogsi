module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ["<rootDir>/__tests__/data/"],
  coverageReporters: ["json-summary", "text", "lcov"]
};