const Material = require('../models/Material');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.getMaterialsByNode = asyncHandler(async (req, res) => {
    const filter = { nodeId: req.params.nodeId, userId: req.user._id };
    if (req.query.tag) filter.tags = req.query.tag;

    const materials = await Material.find(filter).sort({ orderIndex: 1 }).lean();
    res.json(materials);
});

exports.createMaterial = asyncHandler(async (req, res) => {
    const data = { ...req.body, userId: req.user._id };
    const material = new Material(data);
    await material.save();

    logger.info(`Material created: ${material._id} by user ${req.user._id}`);
    res.status(201).json(material);
});

exports.updateMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
    );

    if (!material) {
        throw new AppError('Material not found', 404);
    }

    logger.info(`Material updated: ${material._id}`);
    res.json(material);
});

exports.deleteMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!material) {
        throw new AppError('Material not found', 404);
    }

    logger.info(`Material deleted: ${req.params.id}`);
    res.json({ message: 'Material deleted' });
});
