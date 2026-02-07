export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: '../../coverage/apps/api',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/main.ts',
    'src/app.module.ts',
    'src/entities/',
    'src/health/',
  ],
  coverageThreshold: {
    global: {
      statements: 78,
      branches: 50,
      functions: 65,
      lines: 80,
    },
  },
};
