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
        const dataPath = path.join(__dirname, 'products.js');
        if (fs.existsSync(dataPath)) {
            delete require.cache[require.resolve('./products.js')];
            const mod = require('./products.js');
            return Array.isArray(mod) ? mod : (mod.products || []);
        }
    } catch (e) {
        console.error("Error reading products:", e);
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

// Short Secret Admin Route
app.get('/obiugo-admin', (req, res) => {
    const products = getProducts();
    res.render('admin', { products });
});

app.listen(PORT, () => {
    console.log(`ObiUgo MarketHub running on port ${PORT}`);
});
