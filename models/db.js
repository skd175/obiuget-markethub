const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'database.json');

function getData() {
    if (!fs.existsSync(dbFile)) {
        const initialData = {
            products: [
                { id: 'p1', name: 'Infinix Hot Phone', price: 85000, category: 'Phones', image: 'https://via.placeholder.com/150' },
                { id: 'p2', name: 'Smart LED TV 32"', price: 120000, category: 'Electronics', image: 'https://via.placeholder.com/150' },
                { id: 'p3', name: 'HP EliteBook Laptop', price: 150000, category: 'Computing', image: 'https://via.placeholder.com/150' },
                { id: 'p4', name: 'Solar Inverter Kit', price: 250000, category: 'Home & Solar', image: 'https://via.placeholder.com/150' },
                { id: 'p5', name: 'Jollof Rice & Chicken', price: 2500, category: 'Meals', image: 'https://via.placeholder.com/150' },
                { id: 'p6', name: 'Cold Malt Drink', price: 600, category: 'Drinks', image: 'https://via.placeholder.com/150' }
            ],
            orders: []
        };
        fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
    }
    try {
        const data = fs.readFileSync(dbFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { products: [], orders: [] };
    }
}

function saveData(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

module.exports = { getData, saveData };
