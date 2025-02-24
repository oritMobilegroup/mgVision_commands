const jwt = require('jsonwebtoken');


const secretKey = "t6n7n829bxc";
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTczMDM1NDgwNn0.qicwusEWRKzeTmuR-Nj56UaqtxxgrkPEXQZbmkx9ZEM

// Variable to hold the latest generated token
let currentToken;

// Function to generate a permanent token (no expiration)
const generateToken = () => {
  const payload = { id: 1, username: 'admin' }; // Customize your payload as needed
  currentToken = jwt.sign(payload, secretKey); // No expiresIn, so it doesn't expire
  console.log('Permanent token generated:', currentToken);
};

// Initial token generation when the server starts
// generateToken();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  // Check if the token is provided
  if (!token) {
    return res.status(403).send('Token is required');
  }

  // Split the token to remove 'Bearer ' prefix
  const tokenParts = token.split(' ');
  if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
    return res.status(401).send('Invalid token format');
  }

  try {
    // Verify the token (no expiration)
    const decoded = jwt.verify(tokenParts[1], secretKey); // Only use the token part
    req.user = decoded; // Attach the decoded token to req.user
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).send('Invalid token');
  }
};

module.exports = { verifyToken, currentToken };
