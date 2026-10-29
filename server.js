const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to load products safely from products.js or JSON
function getProducts() {
    try {
        // Try loading products.js module if exported as array
        const productsModule = require('./products.js');
        if (Array.isArray(productsModule)) {
            return productsModule;
        }
        if (productsModule.products && Array.isArray(productsModule.products)) {
            return productsModule.products;
        }
    } catch (e) {
        console.log("Could not require products.js directly, reading as text...");
    }

    try {
        const dataPath = path.join(__dirname, 'products.js');
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf8');
            // If it exports like module.exports = [...] or is JSON
            if (raw.includes('module.exports') || raw.includes('export')) {
                delete require.cache[require.resolve('./products.js')];
                return require('./products.js');
            }
            return JSON.parse(raw);
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
