const Material = require('../models/Material');
const fs = require('fs');
const path = require('path');

exports.getMaterialsByNode = async (req, res) => {
    try {
        const filter = { nodeId: req.params.nodeId, userId: req.user._id };
        if (req.query.tag) filter.tags = req.query.tag;
        const materials = await Material.find(filter).sort({ orderIndex: 1 });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createMaterial = async (req, res) => {
    try {
        const data = { ...req.body, userId: req.user._id };
        if (req.file) {
            data.type = 'FILE';
            data.fileData = req.file.buffer;
            data.fileType = req.file.mimetype;
            data.fileName = req.file.originalname;
            data.content = 'FILE_IN_DB'; // Placeholder for content field
        }
        const material = new Material(data);
        await material.save();
        
        // Don't send the buffer back in the JSON response to save bandwidth
        const response = material.toObject();
        delete response.fileData;
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateMaterial = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            // Clean up legacy disk files if replacing
            const old = await Material.findOne({ _id: req.params.id, userId: req.user._id });
            if (old && old.type === 'FILE' && old.content && old.content !== 'FILE_IN_DB') {
                const oldPath = path.join(__dirname, '../uploads', old.content);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            data.type = 'FILE';
            data.fileData = req.file.buffer;
            data.fileType = req.file.mimetype;
            data.fileName = req.file.originalname;
            data.content = 'FILE_IN_DB';
        }
        const material = await Material.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id }, 
            data, 
            { returnDocument: 'after' }
        ).select('-fileData'); // Don't return buffer
        res.json(material);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findOne({ _id: req.params.id, userId: req.user._id });
        if (material && material.type === 'FILE' && material.content && material.content !== 'FILE_IN_DB') {
            const filePath = path.join(__dirname, '../uploads', material.content);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await Material.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Material deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getMaterialFile = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Material not found' });
        
        // Scenario 1: File is in MongoDB (New)
        if (material.fileData) {
            res.set('Content-Type', material.fileType || 'application/octet-stream');
            return res.send(material.fileData);
        }
        
        // Scenario 2: Legacy File on Disk (Old)
        if (material.type === 'FILE' && material.content && material.content !== 'FILE_IN_DB') {
            const filePath = path.join(__dirname, '../uploads', material.content);
            if (fs.existsSync(filePath)) {
                return res.sendFile(filePath);
            }
        }

        res.status(404).json({ message: 'File not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
