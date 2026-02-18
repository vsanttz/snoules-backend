const mongoose = require('mongoose');
const Address = require('../models/Address');
const User = require('../models/User');

const enderecoController = {
    // Listar todos os endereços do usuário
    async listar(req, res) {
        try {
            console.log('📋 Listando endereços para usuário:', req.user.id);
            
            const enderecos = await Address.find({ user: req.user.id })
                .sort({ isDefault: -1, createdAt: -1 });
            
            console.log(`✅ Encontrados ${enderecos.length} endereços`);
            res.json(enderecos);
        } catch (error) {
            console.error('❌ Erro ao listar endereços:', error);
            res.status(500).json({ 
                error: 'Erro interno ao listar endereços',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Buscar endereço por ID
    async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            console.log('🔍 Buscando endereço ID:', id);
            
            const endereco = await Address.findOne({
                _id: id,
                user: req.user.id
            });
            
            if (!endereco) {
                console.log('❌ Endereço não encontrado:', id);
                return res.status(404).json({ error: 'Endereço não encontrado' });
            }
            
            console.log('✅ Endereço encontrado:', endereco._id);
            res.json(endereco);
        } catch (error) {
            console.error('❌ Erro ao buscar endereço:', error);
            
            if (error.name === 'CastError') {
                return res.status(400).json({ error: 'ID de endereço inválido' });
            }
            
            res.status(500).json({ 
                error: 'Erro interno ao buscar endereço',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Criar novo endereço
    async criar(req, res) {
        try {
            console.log('➕ Criando novo endereço para usuário:', req.user.id);
            console.log('📦 Dados recebidos:', req.body);
            
            // Verificar se é o primeiro endereço
            const count = await Address.countDocuments({ user: req.user.id });
            
            const enderecoData = {
                ...req.body,
                user: req.user.id,
                isDefault: count === 0 ? true : (req.body.isDefault || false)
            };
            
            // Validar campos obrigatórios
            if (!enderecoData.cep || !enderecoData.logradouro || !enderecoData.numero || 
                !enderecoData.bairro || !enderecoData.cidade || !enderecoData.estado) {
                return res.status(400).json({ 
                    error: 'Campos obrigatórios não preenchidos',
                    required: ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado']
                });
            }
            
            // Limpar e formatar CEP
            enderecoData.cep = enderecoData.cep.replace(/\D/g, '');
            
            // Criar endereço
            const endereco = await Address.create(enderecoData);
            
            // Adicionar referência ao usuário
            await User.findByIdAndUpdate(req.user.id, {
                $push: { addresses: endereco._id }
            });
            
            console.log('✅ Endereço criado com sucesso:', endereco._id);
            
            res.status(201).json({
                message: 'Endereço adicionado com sucesso',
                endereco,
                id: endereco._id
            });
        } catch (error) {
            console.error('❌ Erro ao criar endereço:', error);
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({ 
                    error: 'Dados inválidos',
                    details: Object.values(error.errors).map(e => e.message)
                });
            }
            
            res.status(500).json({ 
                error: 'Erro interno ao criar endereço',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Atualizar endereço
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            console.log('✏️ Atualizando endereço ID:', id);
            console.log('📦 Dados recebidos:', req.body);
            
            // Buscar endereço
            const endereco = await Address.findOne({
                _id: id,
                user: req.user.id
            });
            
            if (!endereco) {
                console.log('❌ Endereço não encontrado:', id);
                return res.status(404).json({ error: 'Endereço não encontrado' });
            }
            
            // Atualizar campos
            Object.keys(req.body).forEach(key => {
                if (key !== '_id' && key !== 'user' && key !== 'createdAt') {
                    endereco[key] = req.body[key];
                }
            });
            
            // Limpar e formatar CEP se presente
            if (req.body.cep) {
                endereco.cep = req.body.cep.replace(/\D/g, '');
            }
            
            // Salvar alterações
            await endereco.save();
            
            console.log('✅ Endereço atualizado com sucesso:', id);
            
            res.json({
                message: 'Endereço atualizado com sucesso',
                endereco
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar endereço:', error);
            
            if (error.name === 'CastError') {
                return res.status(400).json({ error: 'ID de endereço inválido' });
            }
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({ 
                    error: 'Dados inválidos',
                    details: Object.values(error.errors).map(e => e.message)
                });
            }
            
            res.status(500).json({ 
                error: 'Erro interno ao atualizar endereço',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // DELETAR ENDEREÇO - VERSÃO CORRIGIDA
    async deletar(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            console.log('🗑️ ===== INICIANDO EXCLUSÃO DE ENDEREÇO =====');
            console.log('📌 ID recebido:', id);
            console.log('📌 Tipo do ID:', typeof id);
            console.log('📌 Usuário:', userId);
            console.log('📌 Tipo do usuário:', typeof userId);

            // Validar se o ID foi fornecido
            if (!id) {
                console.log('❌ ID não fornecido');
                return res.status(400).json({ error: 'ID do endereço não fornecido' });
            }

            // Tentar converter para ObjectId válido
            let objectId;
            try {
                objectId = new mongoose.Types.ObjectId(id);
                console.log('✅ ID convertido para ObjectId:', objectId);
            } catch (error) {
                console.log('❌ ID inválido:', error.message);
                return res.status(400).json({ 
                    error: 'ID de endereço inválido',
                    details: 'O formato do ID não é válido'
                });
            }

            // Buscar o endereço primeiro (com query mais flexível)
            console.log('🔍 Buscando endereço...');
            
            // Tentar com ObjectId
            let endereco = await Address.findOne({
                _id: objectId,
                user: userId
            });

            // Se não encontrou, tentar com string
            if (!endereco) {
                console.log('⚠️ Endereço não encontrado com ObjectId, tentando com string...');
                endereco = await Address.findOne({
                    _id: id,
                    user: userId
                });
            }

            // Se ainda não encontrou, verificar se existe com outro usuário (para debug)
            if (!endereco) {
                console.log('❌ Endereço não encontrado com os critérios fornecidos');
                
                // Verificar se o endereço existe (para qualquer usuário)
                const qualquerEndereco = await Address.findById(objectId);
                if (qualquerEndereco) {
                    console.log('⚠️ Endereço encontrado mas pertence a outro usuário:');
                    console.log('   - Dono do endereço:', qualquerEndereco.user);
                    console.log('   - Usuário atual:', userId);
                    console.log('   - Dono (string):', qualquerEndereco.user.toString());
                    console.log('   - Usuário (string):', userId.toString());
                    
                    return res.status(403).json({ 
                        error: 'Este endereço pertence a outro usuário',
                        details: 'Você não tem permissão para excluir este endereço'
                    });
                } else {
                    console.log('❌ Endereço não existe no banco de dados');
                    
                    // Listar todos os endereços do usuário para debug
                    const enderecosUsuario = await Address.find({ user: userId }).select('_id');
                    console.log('📋 Endereços do usuário:', enderecosUsuario.map(e => e._id.toString()));
                }
                
                return res.status(404).json({ 
                    error: 'Endereço não encontrado',
                    details: 'Verifique se o ID está correto'
                });
            }

            console.log('✅ Endereço encontrado:');
            console.log('   - ID:', endereco._id);
            console.log('   - Tipo:', endereco.type);
            console.log('   - Logradouro:', endereco.logradouro);
            console.log('   - Número:', endereco.numero);
            console.log('   - Principal:', endereco.isDefault);
            console.log('   - Usuário:', endereco.user);

            // Verificar se é o endereço principal
            const isDefault = endereco.isDefault;
            
            // EXCLUIR O ENDEREÇO - usar deleteOne para garantir
            console.log('🗑️ Executando exclusão...');
            const resultado = await Address.deleteOne({ 
                _id: endereco._id,
                user: userId 
            });
            
            console.log('📊 Resultado da exclusão:', resultado);

            if (resultado.deletedCount === 0) {
                console.log('❌ Nenhum documento foi excluído');
                return res.status(500).json({ error: 'Falha ao excluir endereço' });
            }

            // Remover referência do usuário
            console.log('🔄 Removendo referência do usuário...');
            await User.findByIdAndUpdate(userId, {
                $pull: { addresses: endereco._id }
            });

            // Se era o principal, definir outro como principal
            if (isDefault) {
                console.log('🏠 Endereço principal excluído, definindo novo principal...');
                const outroEndereco = await Address.findOne({ user: userId });
                
                if (outroEndereco) {
                    outroEndereco.isDefault = true;
                    await outroEndereco.save();
                    console.log('✅ Novo endereço principal definido:', outroEndereco._id);
                } else {
                    console.log('ℹ️ Usuário não possui mais endereços');
                }
            }

            console.log('✅ Endereço excluído com sucesso!');
            console.log('🗑️ ===== EXCLUSÃO FINALIZADA =====\n');

            res.json({ 
                message: 'Endereço removido com sucesso',
                id: endereco._id,
                deleted: true
            });

        } catch (error) {
            console.error('❌ ===== ERRO NA EXCLUSÃO =====');
            console.error('Mensagem:', error.message);
            console.error('Nome:', error.name);
            console.error('Stack:', error.stack);
            console.error('================================\n');
            
            // Erro específico do MongoDB
            if (error.name === 'CastError') {
                return res.status(400).json({ 
                    error: 'ID de endereço inválido',
                    details: 'O formato do ID não é válido para o MongoDB'
                });
            }
            
            // Erro de validação
            if (error.name === 'ValidationError') {
                return res.status(400).json({ 
                    error: 'Erro de validação',
                    details: Object.values(error.errors).map(e => e.message)
                });
            }
            
            res.status(500).json({ 
                error: 'Erro interno ao excluir endereço',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Definir endereço como principal
    async definirPrincipal(req, res) {
        try {
            const { id } = req.params;
            console.log('⭐ Definindo endereço principal ID:', id);
            
            // Verificar se o endereço existe
            const endereco = await Address.findOne({
                _id: id,
                user: req.user.id
            });
            
            if (!endereco) {
                console.log('❌ Endereço não encontrado:', id);
                return res.status(404).json({ error: 'Endereço não encontrado' });
            }
            
            // Remover principal de todos os outros endereços
            await Address.updateMany(
                { user: req.user.id, _id: { $ne: id } },
                { isDefault: false }
            );
            
            // Definir este como principal
            endereco.isDefault = true;
            await endereco.save();
            
            console.log('✅ Endereço principal atualizado:', id);
            
            res.json({ 
                message: 'Endereço principal atualizado',
                endereco
            });
        } catch (error) {
            console.error('❌ Erro ao definir endereço principal:', error);
            
            if (error.name === 'CastError') {
                return res.status(400).json({ error: 'ID de endereço inválido' });
            }
            
            res.status(500).json({ 
                error: 'Erro interno ao definir endereço principal',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = enderecoController;