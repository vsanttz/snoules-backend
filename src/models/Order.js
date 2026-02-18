const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: String
});

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: String
    },
    shippingAddress: {
        cep: String,
        logradouro: String,
        numero: String,
        complemento: String,
        bairro: String,
        cidade: String,
        estado: String
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true, enum: ['credit', 'debit', 'pix', 'boleto'] },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    trackingCode: String,
    cancelledAt: Date,
    cancelReason: String
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const count = await this.constructor.countDocuments() + 1;
        const sequential = String(count).padStart(4, '0');
        this.orderNumber = `SN${year}${month}${day}${sequential}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);