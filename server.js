const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to load products safely
function getProducts() {
    try {
        const dataPath = path.join(__dirname, 'database.json');
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error("Error reading database:", e);
    }
    return [];
}

// Storefront Route (Zero Admin buttons)
app.get('/', (req, res) => {
    const products = getProducts();
    const category = req.query.category;
    
    let filteredProducts = products;
    if (category) {
        filteredProducts = products.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }
    
    res.render('index', { products: filteredProducts });
});

// Secure Admin Route (Protected by password)
app.get('/admin', (req, res) => {
    if (req.query.password !== 'obiugo2026') {
        return res.status(403).send('Access Denied. Incorrect or missing password.');
    }
    const products = getProducts();
    res.render('admin', { products });
});

app.listen(PORT, () => {
    console.log(`ObiUgo MarketHub running on port ${PORT}`);
});
