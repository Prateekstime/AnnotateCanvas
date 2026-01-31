const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
console.log("MONGO_URI =", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error("MongoDB connection error:", err.message);
    });


// Routes Configuration
app.use('/api/auth', require('./routes/auth'));
app.use('/api/annotations', require('./routes/annotations'));

app.get('/', (req, res) => {
    res.send('AnnotateCanvas API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`,);
});