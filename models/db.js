const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'database.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(dbFile)) {
    const initialData = {
        products: [
            { id: 1, name: "Fresh Jollof Rice & Chicken", price: 2500, category: "Meals", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8" },
            { id: 2, name: "Spaghetti & Meatballs", price: 2000, category: "Meals", image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281244" },
            { id: 3, name: "Cold Malt Drink (Can)", price: 600, category: "Drinks", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97" }
        ],
        orders: []
    };
    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
}

function getData() {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
}

function saveData(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

module.exports = { getData, saveData };
