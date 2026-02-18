const User = require('../models/User');
const Address = require('../models/Address');

const userController = {
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id)
                .populate('addresses')
                .select('-password');
            
            res.json(user);
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async updateProfile(req, res) {
        try {
            const { name, phone, birthDate, gender } = req.body;
            
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { name, phone, birthDate, gender },
                { new: true, runValidators: true }
            ).select('-password');
            
            res.json({
                message: 'Perfil atualizado com sucesso',
                user
            });
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async getFullProfile(req, res) {
        try {
            const [user, addresses] = await Promise.all([
                User.findById(req.user.id).select('-password'),
                Address.find({ user: req.user.id }).sort({ isDefault: -1 })
            ]);
            
            res.json({ usuario: user, enderecos: addresses });
        } catch (error) {
            console.error('Erro ao buscar perfil completo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};

module.exports = userController;