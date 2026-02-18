const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validation = require('../middleware/validation');

router.post('/cadastrar', validation.validateRegister, authController.register);
router.post('/login', validation.validateLogin, authController.login);
router.get('/verificar', authMiddleware.protect, authController.verifyToken);
router.get('/logout', authMiddleware.protect, authController.logout);

module.exports = router;