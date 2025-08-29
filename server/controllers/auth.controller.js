const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const activityService = require('../services/activity.service');
const generateToken = (user) => {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};
const sendAuthResponse = (res, user, token) => {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  
  res.json({ token, user });
};
const register = async (req, res, next) => {
  try {
    const { user } = await authService.register(req.body);
    const fullUser = await userService.getProfile(user.id);
    
    // Логируем регистрацию пользователя
    await activityService.logUserLogin(fullUser.id, {});
    
    const token = generateToken(fullUser);
    sendAuthResponse(res, fullUser, token);
  } catch (error) {
    next(error);
  }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const { user } = await authService.login({ email, password });
    const fullUser = await userService.getProfile(user.id);
    
    await activityService.logUserLogin(fullUser.id, {});
    
    const token = generateToken(fullUser);
    
    sendAuthResponse(res, fullUser, token);
  } catch (error) {
    next(error);
  }
};
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('authToken');
    res.status(200).json({ message: 'Logged out successfully' });
  });
};
const googleCallback = async (req, res, next) => {
  try {
    const fullUser = await userService.getProfile(req.user.id);
    
    await activityService.logUserLogin(fullUser.id, {});
    
    const token = generateToken(fullUser);
    
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    const tokenParam = encodeURIComponent(token);
    const userParam = encodeURIComponent(JSON.stringify(fullUser));
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback#token=${tokenParam}&user=${userParam}`;
    res.redirect(redirectUrl);
  } catch(error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const fullUser = await userService.getProfile(req.user.userId);
    res.json(fullUser);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  googleCallback,
  getMe,
};
