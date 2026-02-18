const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    type: { 
        type: String, 
        enum: ['Residencial', 'Trabalho', 'Outro'], 
        default: 'Residencial' 
    },
    cep: { 
        type: String, 
        required: [true, 'CEP é obrigatório'],
        match: [/^\d{8}$/, 'CEP deve ter 8 dígitos'] 
    },
    logradouro: { 
        type: String, 
        required: [true, 'Logradouro é obrigatório'] 
    },
    numero: { 
        type: String, 
        required: [true, 'Número é obrigatório'] 
    },
    complemento: { 
        type: String,
        default: ''
    },
    bairro: { 
        type: String, 
        required: [true, 'Bairro é obrigatório'] 
    },
    cidade: { 
        type: String, 
        required: [true, 'Cidade é obrigatória'] 
    },
    estado: { 
        type: String, 
        required: [true, 'Estado é obrigatório'], 
        uppercase: true, 
        minlength: 2, 
        maxlength: 2 
    },
    referencia: String,
    isDefault: { 
        type: Boolean, 
        default: false 
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para melhor performance
addressSchema.index({ user: 1, isDefault: -1 });
addressSchema.index({ user: 1, createdAt: -1 });

// Middleware para garantir apenas um endereço principal
addressSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

// Middleware para quando um endereço é deletado
addressSchema.post('findOneAndDelete', async function(doc) {
    if (doc && doc.isDefault) {
        // Se era o principal, define outro como principal
        const outro = await this.model.findOne({ user: doc.user });
        if (outro) {
            outro.isDefault = true;
            await outro.save();
        }
    }
});

module.exports = mongoose.model('Address', addressSchema);