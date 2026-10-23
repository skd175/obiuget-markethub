const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { getData, saveData } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Home route - display products
app.get('/', (req, res) => {
    const db = getData();
    res.render('index', { products: db.products });
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

app.listen(PORT, () => {
    console.log(`ObiUgo MarketHub server running at http://localhost:${PORT}`);
});
