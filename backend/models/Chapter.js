const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    orderIndex: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Indexes for query performance
chapterSchema.index({ userId: 1, subjectId: 1, orderIndex: 1 });
chapterSchema.index({ userId: 1, name: 1 });
chapterSchema.index({ subjectId: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
