const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const authMiddleware = require('../middleware/auth');

router.get('/frete/:cep', pedidoController.calcularFrete);

router.use(authMiddleware.protect);

router.get('/', pedidoController.listar);
router.get('/:id', pedidoController.buscarPorId);
router.post('/', pedidoController.criar);
router.put('/:id/cancelar', pedidoController.cancelar);

module.exports = router;