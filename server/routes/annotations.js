const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Annotation = require('../models/Annotation');

// Get all annotations for user
router.get('/', auth, async (req, res) => {
    try {
        const annotations = await Annotation.find({ userId: req.user.id });
        res.json(annotations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create new annotation
router.post('/', auth, async (req, res) => {
    const { x, y, width, height, id, fill } = req.body;
    try {
        const newAnnotation = new Annotation({
            x, y, width, height, id, fill,
            userId: req.user.id
        });
        const annotation = await newAnnotation.save();
        res.json(annotation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update annotation
router.put('/:id', auth, async (req, res) => {
    const { x, y, width, height, fill } = req.body;
    try {
        let annotation = await Annotation.findOne({ id: req.params.id, userId: req.user.id });
        if (!annotation) return res.status(404).json({ msg: 'Annotation not found' });

        annotation.x = x;
        annotation.y = y;
        annotation.width = width;
        annotation.height = height;
        annotation.fill = fill; // Optional update

        await annotation.save();
        res.json(annotation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete annotation
router.delete('/:id', auth, async (req, res) => {
    try {
        // Find by Konva ID (string) not ObjectId
        const annotation = await Annotation.findOne({ id: req.params.id, userId: req.user.id });
        if (!annotation) return res.status(404).json({ msg: 'Annotation not found' });

        await Annotation.deleteOne({ id: req.params.id, userId: req.user.id });
        res.json({ msg: 'Annotation removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
