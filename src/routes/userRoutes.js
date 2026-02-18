const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.protect);

router.get('/perfil', userController.getProfile);
router.put('/perfil', userController.updateProfile);
router.get('/perfil/completo', userController.getFullProfile);

module.exports = router;