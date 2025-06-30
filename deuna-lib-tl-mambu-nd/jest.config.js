module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['cobertura', 'lcov', 'text', 'text-summary'],
  preset: 'ts-jest',
  reporters: [
    'default',
    [ 'jest-junit', { outputDirectory: 'reports', outputName: 'junit-report.xml' } ],
  ],
  setupFiles: ['./test/setup-tests.ts'],
  testMatch: ['**/*.spec.ts'],
};
