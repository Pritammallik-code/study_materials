const Joi = require('joi');

// Validation schemas
const schemas = {
    // Auth schemas
    register: Joi.object({
        name: Joi.string().trim().min(2).max(50).required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().min(6).max(100).required()
    }),
    login: Joi.object({
        email: Joi.string().trim().email().required(),
        password: Joi.string().required()
    }),

    // Hierarchy schemas
    createSubject: Joi.object({
        name: Joi.string().trim().min(1).max(200).required(),
        description: Joi.string().trim().max(1000).allow('', null),
        orderIndex: Joi.number().integer().min(0).default(0)
    }),
    updateSubject: Joi.object({
        name: Joi.string().trim().min(1).max(200),
        description: Joi.string().trim().max(1000).allow('', null),
        orderIndex: Joi.number().integer().min(0)
    }),
    createChapter: Joi.object({
        name: Joi.string().trim().min(1).max(200).required(),
        subjectId: Joi.string().hex().length(24).required(),
        orderIndex: Joi.number().integer().min(0).default(0)
    }),
    updateChapter: Joi.object({
        name: Joi.string().trim().min(1).max(200),
        orderIndex: Joi.number().integer().min(0)
    }),
    createTopic: Joi.object({
        name: Joi.string().trim().min(1).max(200).required(),
        chapterId: Joi.string().hex().length(24).required(),
        orderIndex: Joi.number().integer().min(0).default(0)
    }),
    updateTopic: Joi.object({
        name: Joi.string().trim().min(1).max(200),
        orderIndex: Joi.number().integer().min(0),
        isCompleted: Joi.boolean(),
        isPinned: Joi.boolean()
    }),
    moveTopic: Joi.object({
        newChapterId: Joi.string().hex().length(24).required()
    }),

    // Material schemas
    createMaterial: Joi.object({
        title: Joi.string().trim().min(1).max(200).required(),
        type: Joi.string().valid('TEXT', 'LINK', 'CODE').required(),
        content: Joi.string().trim().min(1).max(50000).required(),
        tags: Joi.array().items(Joi.string().trim().max(50)).max(20).default([]),
        nodeId: Joi.string().hex().length(24).required(),
        nodeType: Joi.string().valid('SUBJECT', 'CHAPTER', 'TOPIC').required(),
        orderIndex: Joi.number().integer().min(0).default(0)
    }),
    updateMaterial: Joi.object({
        title: Joi.string().trim().min(1).max(200),
        type: Joi.string().valid('TEXT', 'LINK', 'CODE'),
        content: Joi.string().trim().min(1).max(50000),
        tags: Joi.array().items(Joi.string().trim().max(50)).max(20),
        orderIndex: Joi.number().integer().min(0)
    }),
    reorderMaterials: Joi.object({
        materialIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required()
    })
};

// Middleware factory
const validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        if (!schema) {
            return res.status(500).json({ message: 'Validation schema not found' });
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({
                message: 'Validation error',
                errors
            });
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};

// ID parameter validation
const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        const schema = Joi.string().hex().length(24).required();
        const { error } = schema.validate(id);

        if (error) {
            return res.status(400).json({
                message: `Invalid ${paramName}`,
                error: error.message
            });
        }
        next();
    };
};

module.exports = { validate, validateObjectId };
