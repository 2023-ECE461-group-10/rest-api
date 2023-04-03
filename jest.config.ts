/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['**/src/**/*.ts'],
  setupFiles: ["<rootDir>/.jest/setEnvVars.ts"]
};