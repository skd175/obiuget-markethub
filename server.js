const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ storage: storage });

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

app.get('/', (req, res) => {
    const products = getProducts();
    const category = req.query.category;
    let filteredProducts = products;
    if (category) {
        filteredProducts = products.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }
    res.render('index', { products: filteredProducts });
});

app.get('/obiugo-admin', (req, res) => {
    const products = getProducts();
    res.render('admin', { products });
});

// Handle Product Addition with Direct Image File Upload
app.post('/admin/add', upload.single('imageFile'), (req, res) => {
    try {
        const { name, price, category } = req.body;
        const products = getProducts();
        
        // Use uploaded file path or fallback image
        let imagePath = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        const newProduct = {
            name: name,
            price: Number(price),
            category: category,
            image: imagePath
        };

        products.unshift(newProduct);
        const fileContent = `module.exports = ${JSON.stringify(products, null, 4)};\n`;
        fs.writeFileSync(path.join(__dirname, 'products.js'), fileContent, 'utf8');

        res.redirect('/obiugo-admin');
    } catch (e) {
        console.error("Error adding product with image:", e);
        res.status(500).send("Error adding product");
    }
});

app.listen(PORT, () => {
    console.log(`ObiUgo MarketHub running on port ${PORT}`);
});
