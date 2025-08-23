const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const generateToken = (user) => {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};
const sendAuthResponse = (res, user, token) => {
  res.json({ token, user });
};
const register = async (req, res, next) => {
  try {
    const { user } = await authService.register(req.body);
    const fullUser = await userService.getProfile(user.id);
    const token = generateToken(fullUser);
    sendAuthResponse(res, fullUser, token);
  } catch (error) {
    next(error);
  }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('🔍 Login attempt for:', email);
    
    const { user } = await authService.login({ email, password });
    console.log('✅ Auth service returned user:', user);
    
    const fullUser = await userService.getProfile(user.id);
    console.log('✅ User service returned profile:', fullUser);
    
    const token = generateToken(fullUser);
    console.log('🔑 Generated token:', token.substring(0, 20) + '...');
    
    const response = { token, user: fullUser };
    console.log('📤 Sending response:', { token: token.substring(0, 20) + '...', user: fullUser.id });
    
    sendAuthResponse(res, fullUser, token);
  } catch (error) {
    console.error('💥 Login error:', error);
    next(error);
  }
};
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
};
const googleCallback = async (req, res, next) => {
  try {
    const fullUser = await userService.getProfile(req.user.id);
    const token = generateToken(fullUser);
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
    console.log('🔍 getMe вызван, req.user:', req.user);
    console.log('🔍 req.user.userId:', req.user?.userId);
    
    // req.user уже доступен благодаря passport.authenticate('jwt')
    const fullUser = await userService.getProfile(req.user.userId);
    console.log('✅ Получили профиль пользователя:', fullUser);
    
    res.json(fullUser);
  } catch (error) {
    console.error('💥 Ошибка в getMe:', error);
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
