const mongoose = require('mongoose');

const AnnotationSchema = new mongoose.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    fill: { type: String, default: 'transparent' }, // or random color
    stroke: { type: String, default: 'red' },
    id: { type: String, required: true }, // Frontend ID for Konva
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Annotation', AnnotationSchema);
