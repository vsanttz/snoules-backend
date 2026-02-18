const User = require('../models/User');
const Address = require('../models/Address');
const Order = require('../models/Order');

const contaController = {
    async alterarSenha(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            
            const user = await User.findById(req.user.id).select('+password');
            
            if (!user || !(await user.comparePassword(currentPassword))) {
                return res.status(401).json({ error: 'Senha atual incorreta' });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' });
            }
            
            user.password = newPassword;
            await user.save();
            
            res.json({ message: 'Senha alterada com sucesso' });
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    async excluirConta(req, res) {
        try {
            const pedidosAtivos = await Order.findOne({
                user: req.user.id,
                status: { $in: ['pending', 'processing', 'shipped'] }
            });
            
            if (pedidosAtivos) {
                return res.status(400).json({ error: 'Não é possível excluir conta com pedidos em andamento' });
            }
            
            await Address.deleteMany({ user: req.user.id });
            await User.findByIdAndDelete(req.user.id);
            
            res.json({ message: 'Conta excluída com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    async solicitarRecuperacao(req, res) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            
            const resetToken = Math.random().toString(36).substring(2, 15);
            user.passwordResetToken = resetToken;
            user.passwordResetExpires = Date.now() + 3600000;
            await user.save();
            
            console.log(`🔐 Token de recuperação: ${resetToken}`);
            
            res.json({ 
                message: 'Email de recuperação enviado',
                resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
            });
        } catch (error) {
            console.error('Erro ao solicitar recuperação:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    async resetarSenha(req, res) {
        try {
            const { token, newPassword } = req.body;
            
            const user = await User.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: Date.now() }
            });
            
            if (!user) {
                return res.status(400).json({ error: 'Token inválido ou expirado' });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
            }
            
            user.password = newPassword;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            
            res.json({ message: 'Senha redefinida com sucesso' });
        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    }
};

module.exports = contaController;