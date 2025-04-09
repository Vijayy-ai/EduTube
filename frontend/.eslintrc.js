module.exports = {
  extends: ['react-app', 'react-app/jest'],
  // Override rules for production
  rules: {
    // Disable rules that often cause problems in deployment
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 'off' : 'warn',
    'react-hooks/exhaustive-deps': process.env.NODE_ENV === 'production' ? 'off' : 'warn',
    'import/no-anonymous-default-export': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'off' : 'warn'
  },
  // Ignore linting for certain files and directories
  ignorePatterns: [
    'build/',
    'dist/',
    'node_modules/',
    '*.config.js',
    '*.test.js'
  ]
}; 