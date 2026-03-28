const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: ['TEXT', 'LINK', 'CODE'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    tags: { type: [String], default: [] },
    nodeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    nodeType: { type: String, enum: ['SUBJECT', 'CHAPTER', 'TOPIC'], required: true },
    orderIndex: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Indexes for query performance
materialSchema.index({ userId: 1, nodeId: 1, orderIndex: 1 });
materialSchema.index({ userId: 1, tags: 1 });
materialSchema.index({ userId: 1, title: 1 });
materialSchema.index({ nodeId: 1, nodeType: 1 });

module.exports = mongoose.model('Material', materialSchema);
