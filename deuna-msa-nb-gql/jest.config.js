module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '.config.ts',
    '.dto.ts',
    '.entity.ts',
    '.enum.ts',
    '.interface.ts',
    '.module.ts',
    '.utils.ts',
    'config/',
    'constants/',
    'db/migration/',
    'dto/',
    'entities/',
    'enums/',
    'interfaces/',
    'meta-service/',
    'utils/',
    'core/decorators/',
    'common.ts',
    'main.ts',
    'schema.ts',
    'mocks/',
    'fakes/',
    '.mock.ts',
    '.fake.ts',
    'mock-',
    'fake-',
  ],
  coverageReporters: ['cobertura', 'lcov', 'text', 'text-summary'],
  preset: 'ts-jest',
  reporters: [
    'default',
    [ 'jest-junit', { outputDirectory: 'reports', outputName: 'junit-report.xml' } ],
  ],
  setupFiles: ['./test/setup-tests.ts'],
  testMatch: ['**/*.spec.ts'],
};
