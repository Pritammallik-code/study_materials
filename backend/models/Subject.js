const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    orderIndex: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Indexes for query performance
subjectSchema.index({ userId: 1, orderIndex: 1 });
subjectSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
