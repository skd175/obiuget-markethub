const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { getData, saveData } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Explicitly set views and public folders for cloud hosting like Render
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Home route - display products with robust category filter
app.get('/', (req, res) => {
    const db = getData();
    const selectedCategory = req.query.category;
    
    let filteredProducts = db.products;
    if (selectedCategory && selectedCategory !== 'All') {
        filteredProducts = db.products.filter(p => 
            p.category && p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
        );
    }

    res.render('index', { products: filteredProducts, currentCategory: selectedCategory || 'All' });
});

// Checkout / Place order route
app.post('/order', (req, res) => {
    const { customerName, phone, address, items } = req.body;
    const db = getData();
    
    const newOrder = {
        id: Date.now(),
        customerName,
        phone,
        address,
        items: items ? JSON.parse(items) : [],
        date: new Date().toISOString()
    };

    db.orders.push(newOrder);
    saveData(db);

    res.json({ success: true, message: "Order placed successfully!", orderId: newOrder.id });
});

// Admin Dashboard route
app.get('/admin', (req, res) => {
    const db = getData();
    res.render('admin', { products: db.products, orders: db.orders });
});

// Add Product route
app.post('/admin/add-product', (req, res) => {
    const { name, price, category, image } = req.body;
    const db = getData();

    const newProduct = {
        id: 'p_' + Date.now(),
        name,
        price: Number(price),
        category: category.trim(),
        image: image && image.trim() !== '' ? image : 'https://via.placeholder.com/150'
    };

    db.products.push(newProduct);
    saveData(db);

    res.redirect('/admin');
});

// Delete Order route
app.post('/admin/delete-order/:id', (req, res) => {
    const orderId = Number(req.params.id);
    const db = getData();

    db.orders = db.orders.filter(o => o.id !== orderId);
    saveData(db);

    res.redirect('/admin');
});

app.listen(PORT, () => {
    console.log(`ObiUgo MarketHub server running at http://localhost:${PORT}`);
});
