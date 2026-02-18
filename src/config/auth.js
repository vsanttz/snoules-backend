module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET || 'snoules_secret_key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    password: {
        saltRounds: 10,
        minLength: 6,
    },
    messages: {
        invalidCredentials: 'Email ou senha inválidos',
        userExists: 'Este email já está cadastrado',
        userNotFound: 'Usuário não encontrado',
        invalidToken: 'Token inválido ou expirado',
        unauthorized: 'Não autorizado',
        forbidden: 'Acesso negado',
    }
};