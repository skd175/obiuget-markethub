const express = require('express');
const cors = require('cors');
const path = require('path');
const initialProducts = require('./products');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let products = [...initialProducts];

app.get('/api/products', (req, res) => {
    const { search, category } = req.query;
    let result = products;

    if (category && category !== 'all') {
        result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
        result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }

    res.json(result);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
