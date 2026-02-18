const { body, validationResult } = require('express-validator');

const validationMiddleware = {
    validateRegister: [
        body('name').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ min: 3 }),
        body('email').trim().notEmpty().withMessage('Email é obrigatório').isEmail(),
        body('password').notEmpty().withMessage('Senha é obrigatória').isLength({ min: 6 }),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
            }
            next();
        }
    ],

    validateLogin: [
        body('email').trim().notEmpty().withMessage('Email é obrigatório').isEmail(),
        body('password').notEmpty().withMessage('Senha é obrigatória'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
            }
            next();
        }
    ],

    validateAddress: [
        body('cep').trim().notEmpty().withMessage('CEP é obrigatório').matches(/^\d{8}$/),
        body('logradouro').trim().notEmpty().withMessage('Logradouro é obrigatório'),
        body('numero').trim().notEmpty().withMessage('Número é obrigatório'),
        body('bairro').trim().notEmpty().withMessage('Bairro é obrigatório'),
        body('cidade').trim().notEmpty().withMessage('Cidade é obrigatória'),
        body('estado').trim().notEmpty().withMessage('Estado é obrigatório').isLength({ min: 2, max: 2 }),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Dados inválidos', details: errors.array() });
            }
            next();
        }
    ]
};

module.exports = validationMiddleware;