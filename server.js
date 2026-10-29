const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { getData, saveData } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'obiugo2026';

// Explicitly set views and public folders for cloud hosting
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Home route - display products with category filter
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

// Admin Login Gate route
app.get('/admin', (req, res) => {
    const password = req.query.password;
    
    // If no password or wrong password is provided, show a simple password entry page or error
    if (password !== ADMIN_PASSWORD) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Login - ObiUgo MarketHub</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-100 flex items-center justify-center h-screen">
                <div class="bg-white p-8 rounded-xl shadow-md w-96">
                    <h2 class="text-2xl font-bold mb-4 text-gray-800 text-center">Admin Access</h2>
                    <form method="GET" action="/admin" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Enter Admin Password:</label>
                            <input type="password" name="password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        </div>
                        <button type="submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-semibold">Login</button>
                    </form>
                </div>
            </body>
            </html>
        `);
    }

    // If password is correct, load the admin dashboard
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

    res.redirect('/admin?password=' + ADMIN_PASSWORD);
});

// Delete Order route
app.post('/admin/delete-order/:id', (req, res) => {
    const orderId = Number(req.params.id);
    const db = getData();

    db.orders = db.orders.filter(o => o.id !== orderId);
    saveData(db);

    res.redirect('/admin?password=' + ADMIN_PASSWORD);
});

app.listen(PORT, () => {
    console.log(`ObiUgo MarketHub server running at http://localhost:${PORT}`);
});
