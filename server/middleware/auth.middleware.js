const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No authorization: token not found' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) {
      return res.status(401).json({ message: 'No authorization: invalid token - missing userId' });
    }
    req.user = { 
      userId: decoded.userId,
      id: decoded.userId, 
      email: decoded.email,
      role: decoded.role || 'user'
    };
    next();
  } catch (e) {
    res.status(401).json({ message: 'No authorization: invalid token' });
  }
};

module.exports = {
  authenticateToken
};
