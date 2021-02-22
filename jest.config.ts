export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	modulePathIgnorePatterns: ['<rootDir>/__tests__/data/'],
	coverageReporters: ['json-summary', 'text', 'lcov'],
	resolver: 'jest-ts-webcompat-resolver'
};
