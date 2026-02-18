const express = require('express');
const router = express.Router();
const contaController = require('../controllers/contaController');
const authMiddleware = require('../middleware/auth');

router.post('/recuperar-senha', contaController.solicitarRecuperacao);
router.post('/resetar-senha', contaController.resetarSenha);

router.use(authMiddleware.protect);

router.post('/alterar-senha', contaController.alterarSenha);
router.delete('/excluir-conta', contaController.excluirConta);

module.exports = router;