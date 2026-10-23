/* One rule, on purpose.
 *
 * The API had no linter. A refactor that removed a fallback secret left
 * `requiredSecret` used in three places and imported in none; Node only
 * notices an undefined name when the line runs, the line sat inside a
 * try/catch, and the catch reported it as "Invalid refresh token". Every
 * session ended at fifteen minutes and nothing in the logs said why.
 *
 * `no-undef` catches exactly that at lint time. Style rules are left off so
 * the output stays a list of real problems.
 *
 *   npm run lint
 */
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'dist/**'] },
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      'no-undef': 'error'
    }
  },
  {
    files: ['src/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } }
  }
];
