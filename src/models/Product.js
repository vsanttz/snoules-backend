const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Título é obrigatório'],
        trim: true,
        index: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Descrição é obrigatória']
    },
    shortDescription: {
        type: String,
        maxlength: 200
    },
    price: {
        type: Number,
        required: [true, 'Preço é obrigatório'],
        min: [0, 'Preço não pode ser negativo']
    },
    comparePrice: {
        type: Number,
        min: 0
    },
    costPrice: {
        type: Number,
        min: 0,
        select: false
    },
    category: {
        type: String,
        required: true,
        enum: ['camisetas', 'shorts', 'calcas', 'jaquetas', 'acessorios', 'calcados']
    },
    tags: [String],
    images: [{
        url: String,
        alt: String,
        isMain: { type: Boolean, default: false }
    }],
    features: [String],
    sizes: [{
        size: String,
        quantity: { type: Number, default: 0 }
    }],
    colors: [{
        name: String,
        hex: String,
        quantity: { type: Number, default: 0 }
    }],
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    sales: {
        type: Number,
        default: 0
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Índices para busca
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });

// Gerar slug automaticamente
productSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);