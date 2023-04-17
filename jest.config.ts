/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['**/src/**/*.ts'],
  testPathIgnorePatterns: ["<rootDir>/__tests__/integration/common.ts"]
};