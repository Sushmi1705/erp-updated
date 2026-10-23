const jwt = require('jsonwebtoken');

/* Signing keys come from the environment, and there is no fallback.
 *
 * Both functions used to fall back to a literal in this file
 * ('precision_auto_secret_jwt_key_2026'). Anyone with the source — it is in
 * the repository — could mint a token for any user id and sign in as the
 * owner. It never fired in this deployment because .env sets both, which is
 * exactly what makes it dangerous: a restore onto a fresh box with no .env
 * would come up looking healthy and be wide open, with nothing in the logs
 * to say so.
 *
 * Failing at boot is the right behaviour: a server that cannot sign a
 * trustworthy session should not accept requests.
 */
const requiredSecret = (name) => {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(
      `${name} is missing or too short. Set it to at least 32 random characters ` +
      `in the server's .env — the API cannot issue sessions without it.`
    );
  }
  return value;
};

const generateToken = (id) =>
  jwt.sign({ id }, requiredSecret('JWT_SECRET'), {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, requiredSecret('JWT_REFRESH_SECRET'), {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

module.exports = { generateToken, generateRefreshToken, requiredSecret };
