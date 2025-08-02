const jwt = require('jsonwebtoken');

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d', // Refresh token expires in 7 days
  });
};

module.exports = generateRefreshToken; 