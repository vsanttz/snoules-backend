const express = require('express');
const router = express.Router();
const enderecoController = require('../controllers/enderecoController');
const authMiddleware = require('../middleware/auth');
const validation = require('../middleware/validation');

router.use(authMiddleware.protect);

router.get('/', enderecoController.listar);
router.get('/:id', enderecoController.buscarPorId);
router.post('/', validation.validateAddress, enderecoController.criar);
router.put('/:id', validation.validateAddress, enderecoController.atualizar);
router.delete('/:id', enderecoController.deletar);
router.put('/:id/principal', enderecoController.definirPrincipal);

module.exports = router;