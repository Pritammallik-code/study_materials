const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['TEXT', 'LINK', 'CODE'] },
    content: { type: String },
    text: { type: String },
    code: { type: String },
    link: { type: String },
    tags: { type: [String], default: [] },
    nodeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    nodeType: { type: String, enum: ['SUBJECT', 'CHAPTER', 'TOPIC'], required: true },
    orderIndex: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
