const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user: userFromService } = await authService.login({ email, password });
    
    const userForClient = {
      id: userFromService.id,
      name: userFromService.first_name,
      email: userFromService.email,
      gender: userFromService.gender,
      age: userFromService.age,
      city: userFromService.city,
      coins: userFromService.coins
    };

    res.json({ token, user: userForClient });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  logout,
};