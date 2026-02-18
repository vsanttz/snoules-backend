const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authConfig = require('../config/auth');

const authController = {
    async register(req, res) {
        try {
            const { name, email, password } = req.body;
            
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ error: 'Este email já está cadastrado' });
            }
            
            const user = await User.create({ name, email, password });
            
            const token = jwt.sign(
                { id: user._id, email: user.email },
                authConfig.jwt.secret,
                { expiresIn: authConfig.jwt.expiresIn }
            );
            
            res.status(201).json({
                message: 'Usuário cadastrado com sucesso',
                token,
                user: user.toPublicJSON()
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({ email }).select('+password');
            
            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
            
            if (!user.isActive) {
                return res.status(401).json({ error: 'Usuário desativado' });
            }
            
            user.lastLogin = new Date();
            await user.save();
            
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                authConfig.jwt.secret,
                { expiresIn: authConfig.jwt.expiresIn }
            );
            
            res.json({
                message: 'Login realizado com sucesso',
                token,
                user: user.toPublicJSON()
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async verifyToken(req, res) {
        try {
            res.json({ valid: true, user: req.user.toPublicJSON() });
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async logout(req, res) {
        try {
            res.json({ message: 'Logout realizado com sucesso' });
        } catch (error) {
            console.error('Erro no logout:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};

module.exports = authController;