const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authConfig = require('../config/auth');

const authMiddleware = {
    async protect(req, res, next) {
        try {
            let token;
            
            if (req.headers.authorization?.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            }
            
            if (!token) {
                return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
            }
            
            const decoded = jwt.verify(token, authConfig.jwt.secret);
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user || !user.isActive) {
                return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
            }
            
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Token inválido' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expirado' });
            }
            return res.status(500).json({ error: 'Erro interno' });
        }
    },

    restrictTo(...roles) {
        return (req, res, next) => {
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Permissão negada' });
            }
            next();
        };
    }
};

module.exports = authMiddleware;