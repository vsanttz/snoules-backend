const Order = require('../models/Order');
const Product = require('../models/Product');

const pedidoController = {
    async listar(req, res) {
        try {
            const pedidos = await Order.find({ user: req.user.id })
                .sort({ createdAt: -1 });
            res.json(pedidos);
        } catch (error) {
            console.error('Erro ao listar pedidos:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    async buscarPorId(req, res) {
        try {
            const pedido = await Order.findOne({
                _id: req.params.id,
                user: req.user.id
            }).populate('items.product', 'title images');
            
            if (!pedido) {
                return res.status(404).json({ error: 'Pedido não encontrado' });
            }
            
            res.json(pedido);
        } catch (error) {
            console.error('Erro ao buscar pedido:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    async criar(req, res) {
        try {
            const { items, shippingAddress, paymentMethod } = req.body;
            
            let subtotal = 0;
            for (const item of items) {
                const produto = await Product.findById(item.productId);
                if (!produto) {
                    return res.status(400).json({ error: `Produto não encontrado` });
                }
                if (produto.stock < item.quantity) {
                    return res.status(400).json({ error: `Estoque insuficiente` });
                }
                subtotal += produto.price * item.quantity;
            }
            
            const frete = 15.00;
            const total = subtotal + frete;
            
            const pedido = await Order.create({
                user: req.user.id,
                customer: {
                    name: req.user.name,
                    email: req.user.email,
                    phone: req.user.phone
                },
                shippingAddress,
                items: items.map(item => ({
                    product: item.productId,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                subtotal,
                shippingCost: frete,
                total,
                paymentMethod,
                status: 'pending'
            });
            
            for (const item of items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.quantity, sales: item.quantity }
                });
            }
            
            res.status(201).json({
                message: 'Pedido criado com sucesso',
                pedido
            });
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    async cancelar(req, res) {
        try {
            const pedido = await Order.findOne({
                _id: req.params.id,
                user: req.user.id
            });
            
            if (!pedido) {
                return res.status(404).json({ error: 'Pedido não encontrado' });
            }
            
            if (!['pending', 'processing'].includes(pedido.status)) {
                return res.status(400).json({ error: 'Pedido não pode ser cancelado' });
            }
            
            pedido.status = 'cancelled';
            pedido.cancelledAt = new Date();
            pedido.cancelReason = req.body.motivo || 'Cancelado pelo cliente';
            await pedido.save();
            
            for (const item of pedido.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity, sales: -item.quantity }
                });
            }
            
            res.json({ message: 'Pedido cancelado com sucesso' });
        } catch (error) {
            console.error('Erro ao cancelar pedido:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    async calcularFrete(req, res) {
        try {
            const opcoes = [
                { servico: 'Sedex', prazo: 2, valor: 25.90 },
                { servico: 'PAC', prazo: 5, valor: 15.90 },
                { servico: 'Retirada', prazo: 1, valor: 0 }
            ];
            res.json(opcoes);
        } catch (error) {
            console.error('Erro ao calcular frete:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    }
};

module.exports = pedidoController;