const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const enderecoRoutes = require('./routes/enderecoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const contaRoutes = require('./routes/contaRoutes');

const app = express();

// ===== MIDDLEWARES DE SEGURANÇA =====
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - Proteção contra ataques de força bruta
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por IP
    message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', limiter);

// ===== CORS CONFIGURADO CORRETAMENTE =====
const allowedOrigins = [
    'https://www.snoules.com.br',
    'https://snoules.com.br',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://snoules-backend.onrender.com'
];

// Middleware CORS principal
app.use(cors({
    origin: function(origin, callback) {
        // Permitir requisições sem origem (Postman, apps mobile, etc)
        if (!origin) return callback(null, true);
        
        // Log para debug
        console.log('📡 Requisição de origem:', origin);
        
        // Verificar se a origem está na lista de permitidas
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        
        // Permitir subdomínios do Render (para testes)
        if (origin.includes('onrender.com')) {
            return callback(null, true);
        }
        
        console.log('🚫 CORS bloqueado para:', origin);
        callback(null, false);
    },
    credentials: true, // Permitir cookies e headers de autenticação
    optionsSuccessStatus: 200
}));

// Headers manuais para garantir CORS (backup)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Se a origem for permitida, adicionar headers
    if (origin && (allowedOrigins.includes(origin) || origin.includes('onrender.com') || origin.includes('snoules.com.br'))) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Responder imediatamente a requisições OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// ===== PARSERS =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== LOGGING DETALHADO =====
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// ===== ROTA RAIZ =====
app.get('/', (req, res) => {
    res.json({
        nome: "Snoules API",
        versao: "1.0.0",
        status: "online",
        ambiente: process.env.NODE_ENV || 'development',
        backend_url: process.env.BACKEND_URL || 'https://snoules-backend.onrender.com',
        frontend_url: process.env.FRONTEND_URL || 'https://www.snoules.com.br',
        mongodb: process.env.MONGODB_URI ? 'configurado' : 'não configurado',
        endpoints: {
            auth: "/api/auth",
            conta: "/api/conta",
            usuarios: "/api/usuarios",
            produtos: "/api/produtos",
            enderecos: "/api/enderecos",
            pedidos: "/api/pedidos",
            health: "/health",
            ping: "/ping"
        }
    });
});

// ===== HEALTH CHECK DETALHADO =====
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        mongodb: 'connected',
        memory: process.memoryUsage(),
        message: 'Servidor Snoules funcionando perfeitamente!'
    });
});

// ===== PING =====
app.get('/ping', (req, res) => {
    res.json({ 
        pong: true, 
        timestamp: new Date().toISOString(),
        message: 'Pong! Servidor está respondendo.'
    });
});

// ===== ROTAS DA API =====
app.use('/api/auth', authRoutes);
app.use('/api/conta', contaRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/produtos', productRoutes);
app.use('/api/enderecos', enderecoRoutes);
app.use('/api/pedidos', pedidoRoutes);

// ===== ROTA 404 COM DOCUMENTAÇÃO =====
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        requested: req.originalUrl,
        method: req.method,
        message: 'Verifique a documentação da API para rotas válidas',
        endpoints: {
            auth: ["POST /api/auth/cadastrar", "POST /api/auth/login", "GET /api/auth/verificar"],
            conta: ["POST /api/conta/alterar-senha", "POST /api/conta/recuperar-senha"],
            enderecos: ["GET /api/enderecos", "POST /api/enderecos", "PUT /api/enderecos/:id", "DELETE /api/enderecos/:id"],
            pedidos: ["GET /api/pedidos", "POST /api/pedidos"],
            produtos: ["GET /api/produtos", "GET /api/produtos/:id"],
            usuarios: ["GET /api/usuarios/perfil", "PUT /api/usuarios/perfil"]
        }
    });
});

// ===== TRATAMENTO DE ERROS GLOBAL =====
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err);
    
    // Erro de CORS
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'Bloqueado por política CORS',
            message: 'A origem não tem permissão para acessar este recurso'
        });
    }
    
    // Erro de validação
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Erro de validação',
            details: err.message
        });
    }
    
    // Erro interno
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado'
    });
});

module.exports = app;