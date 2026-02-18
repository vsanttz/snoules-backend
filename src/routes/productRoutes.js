const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.listar);
router.get('/featured', productController.getFeatured);
router.get('/:id', productController.buscarPorId);

module.exports = router;