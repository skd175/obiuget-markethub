const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'obiugo2026';

// Direct helper to read database fresh every single time
const getFreshData = () => {
    const dbPath = path.join(__dirname, 'models', 'database.json');
    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("Error reading DB:", err);
    }
    return { products: [], orders: [] };
};

const saveFreshData = (data) => {
    const dbPath = path.join(__dirname, 'models', 'database.json');
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing DB:", err);
    }
};

// Set up storage for uploaded product images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'prod_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Home route - fetches fresh data directly from file every time
app.get('/', (req, res) => {
    const db = getFreshData();
    const selectedCategory = req.query.category;
    
    let filteredProducts = db.products || [];
    if (selectedCategory && selectedCategory !== 'All') {
        filteredProducts = filteredProducts.filter(p => 
            p.category && p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
        );
    }

    res.render('index', { products: filteredProducts, currentCategory: selectedCategory || 'All' });
});

// Checkout route
app.post('/order', (req, res) => {
    const { customerName, phone, address, items } = req.body;
    const db = getFreshData();
    
    const newOrder = {
        id: Date.now(),
        customerName,
        phone,
        address,
        items: items ? JSON.parse(items) : [],
        date: new Date().toISOString()
    };

    db.orders.push(newOrder);
    saveFreshData(db);

    res.json({ success: true, message: "Order placed successfully!", orderId: newOrder.id });
});

// Admin Route with Password Gate & Dashboard UI
app.get('/admin', (req, res) => {
    const password = req.query.password;
    
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

    const db = getFreshData();
    
    let productsHtml = (db.products || []).map(p => `
        <tr class="border-b">
            <td class="p-3"><img src="${p.image}" class="w-12 h-12 object-cover rounded"></td>
            <td class="p-3 font-medium">${p.name}</td>
            <td class="p-3">₦${Number(p.price).toLocaleString()}</td>
            <td class="p-3">${p.category || 'General'}</td>
        </tr>
    `).join('');

    let ordersHtml = (db.orders || []).map(o => `
        <tr class="border-b">
            <td class="p-3">${o.customerName}</td>
            <td class="p-3">${o.phone}</td>
            <td class="p-3">${o.address}</td>
            <td class="p-3">
                <ul class="text-xs">
                    ${o.items.map(i => `<li>${i.name} (x${i.quantity})</li>`).join('')}
                </ul>
            </td>
            <td class="p-3">
                <form action="/admin/delete-order/${o.id}?password=${ADMIN_PASSWORD}" method="POST">
                    <button type="submit" class="bg-red-500 text-white px-3 py-1 rounded text-xs">Delete</button>
                </form>
            </td>
        </tr>
    `).join('');

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Dashboard - ObiUgo MarketHub</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 p-6">
            <div class="max-w-6xl mx-auto space-y-8">
                <div class="flex justify-between items-center bg-white p-6 rounded-xl shadow-md">
                    <h1 class="text-2xl font-bold text-gray-800">ObiUgo Admin Dashboard</h1>
                    <a href="/" class="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">View Storefront</a>
                </div>

                <!-- Add Product Form -->
                <div class="bg-white p-6 rounded-xl shadow-md">
                    <h2 class="text-xl font-bold mb-4 text-gray-800">Add New Product</h2>
                    <form action="/admin/add-product?password=${ADMIN_PASSWORD}" method="POST" enctype="multipart/form-data" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" placeholder="Product Name" required class="p-2 border rounded">
                        <input type="number" name="price" placeholder="Price (₦)" required class="p-2 border rounded">
                        <input type="text" name="category" placeholder="Category (e.g. Home & Solar)" required class="p-2 border rounded">
                        <input type="file" name="imageFile" accept="image/*" class="p-2 border rounded md:col-span-2">
                        <button type="submit" class="md:col-span-2 bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700">Add Product</button>
                    </form>
                </div>

                <!-- Products Table -->
                <div class="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
                    <h2 class="text-xl font-bold mb-4 text-gray-800">Manage Products</h2>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-200 text-gray-700 text-sm">
                                <th class="p-3">Image</th>
                                <th class="p-3">Name</th>
                                <th class="p-3">Price</th>
                                <th class="p-3">Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productsHtml || '<tr><td colspan="4" class="p-4 text-center text-gray-500">No products found.</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <!-- Orders Table -->
                <div class="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
                    <h2 class="text-xl font-bold mb-4 text-gray-800">Customer Orders</h2>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-200 text-gray-700 text-sm">
                                <th class="p-3">Customer</th>
                                <th class="p-3">Phone</th>
                                <th class="p-3">Address</th>
                                <th class="p-3">Items</th>
                                <th class="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ordersHtml || '<tr><td colspan="5" class="p-4 text-center text-gray-500">No orders yet.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Add Product route
app.post('/admin/add-product', upload.single('imageFile'), (req, res) => {
    const password = req.query.password;
    if (password !== ADMIN_PASSWORD) return res.status(403).send("Unauthorized");

    const { name, price, category } = req.body;
    const db = getFreshData();

    let imagePath = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600';
    if (req.file) {
        imagePath = '/uploads/' + req.file.filename;
    }

    const newProduct = {
        id: 'p_' + Date.now(),
        name: name ? name.trim() : 'Unnamed Product',
        price: Number(price) || 0,
        category: category ? category.trim() : 'General',
        image: imagePath
    };

    if (!db.products) db.products = [];
    db.products.push(newProduct);
    saveFreshData(db);

    res.redirect('/admin?password=' + ADMIN_PASSWORD);
});

// Delete Order route
app.post('/admin/delete-order/:id', (req, res) => {
    const password = req.query.password;
    if (password !== ADMIN_PASSWORD) return res.status(403).send("Unauthorized");

    const orderId = Number(req.params.id);
    const db = getFreshData();

    db.orders = (db.orders || []).filter(o => o.id !== orderId);
    saveFreshData(db);

    res.redirect('/admin?password=' + ADMIN_PASSWORD);
});

app.listen(PORT, () => {
    console.log(`ObiUgo MarketHub server running at http://localhost:${PORT}`);
});
