const Product = require('../models/Product');

const productController = {
    async listar(req, res) {
        try {
            const { category, search } = req.query;
            const filter = { isActive: true };
            
            if (category) filter.category = category;
            if (search) filter.$text = { $search: search };
            
            const products = await Product.find(filter).sort({ createdAt: -1 });
            res.json(products);
        } catch (error) {
            console.error('Erro ao listar produtos:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    async buscarPorId(req, res) {
        try {
            const product = await Product.findById(req.params.id);
            
            if (!product) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
            
            product.views += 1;
            await product.save();
            
            res.json(product);
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    async getFeatured(req, res) {
        try {
            const products = await Product.find({ isActive: true, isFeatured: true }).limit(8);
            res.json(products);
        } catch (error) {
            console.error('Erro ao buscar produtos em destaque:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    }
};

module.exports = productController;