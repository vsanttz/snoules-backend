const app = require('./src/app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Conectado');
        
        // CORREÇÃO: Adicionado '0.0.0.0' para aceitar conexões externas
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`
╔════════════════════════════════════════════════╗
║   🚀 Servidor Snoules iniciado com sucesso!   ║
╠════════════════════════════════════════════════╣
║   📡 Porta: ${PORT}                               ║
║   🌐 Ambiente: ${process.env.NODE_ENV}            ║
║   🔗 URL: https://snoules-backend.onrender.com   ║
║   💾 MongoDB: Conectado                        ║
║   📦 Endpoints:                                ║
║   • Auth: /api/auth                            ║
║   • Conta: /api/conta                          ║
║   • Usuários: /api/usuarios                    ║
║   • Produtos: /api/produtos                    ║
║   • Endereços: /api/enderecos                  ║
║   • Pedidos: /api/pedidos                      ║
╚════════════════════════════════════════════════╝
            `);
        });
    })
    .catch(err => {
        console.error('❌ Erro MongoDB:', err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', () => {
    mongoose.connection.close().then(() => {
        console.log('✅ Conexão MongoDB fechada');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM recebido. Fechando conexões...');
    mongoose.connection.close().then(() => {
        console.log('✅ Conexão MongoDB fechada');
        process.exit(0);
    });
});