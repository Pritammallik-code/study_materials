const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    orderIndex: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isCompleted: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes for query performance
topicSchema.index({ userId: 1, chapterId: 1, orderIndex: 1 });
topicSchema.index({ userId: 1, name: 1 });
topicSchema.index({ userId: 1, isPinned: 1, isCompleted: 1 });
topicSchema.index({ chapterId: 1 });

module.exports = mongoose.model('Topic', topicSchema);
