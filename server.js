const express = require('express');
const cors = require('cors');
const path = require('path');
const initialProducts = require('./products');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'obiugo-markethub')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'obiugo-markethub', 'index.html'));
});




let products = [...initialProducts];

app.get('/api/products', (req, res) => {
  const { search, category } = req.query;
  let result = products;

  if (category && category !== 'all') {
    result = result.filter(p => p.category === category);
  }

  if (search) {
    const query = search.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }

  res.json(result);
});

app.post('/api/products', (req, res) => {
  const { name, price, oldPrice, discount, description, image, category } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const newProduct = {
    id: Date.now().toString(),
    category: category || 'home',
    name,
    price: Number(price),
    oldPrice: oldPrice ? Number(oldPrice) : Number(price) * 1.3,
    discount: discount || 'New',
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
  };

  products.push(newProduct);
  res.status(201).json({ message: 'Product added successfully', product: newProduct });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
