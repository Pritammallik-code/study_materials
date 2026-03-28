const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new AppError('User already exists', 400);
    }

    const user = await User.create({ name, email, password });

    logger.info(`New user registered: ${user._id} (${user.email})`);

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
    });
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
        throw new AppError('Invalid email or password', 401);
    }

    logger.info(`User logged in: ${user._id} (${user.email})`);

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
    });
});
