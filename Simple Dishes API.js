const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(express.json());

// Utility: Read dishes from db.json
function readDishes() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return []; // if file missing or empty
  }
}

// Utility: Write dishes to db.json
function writeDishes(dishes) {
  fs.writeFileSync(DB_PATH, JSON.stringify(dishes, null, 2));
}

// POST /dishes → Add new dish
app.post("/dishes", (req, res) => {
  const { name, price, category } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: "Name, price, and category are required" });
  }

  const dishes = readDishes();

  // Generate new ID (max existing + 1)
  const newId = dishes.length ? Math.max(...dishes.map(d => d.id)) + 1 : 1;

  const newDish = { id: newId, name, price, category };
  dishes.push(newDish);
  writeDishes(dishes);

  res.status(201).json(newDish);
});

// GET /dishes → Get all dishes
app.get("/dishes", (req, res) => {
  const dishes = readDishes();
  res.status(200).json(dishes);
});

// GET /dishes/:id → Get dish by ID
app.get("/dishes/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const dishes = readDishes();
  const dish = dishes.find(d => d.id === id);

  if (!dish) {
    return res.status(404).json({ error: "Dish not found" });
  }
  res.status(200).json(dish);
});

// PUT /dishes/:id → Update dish by ID
app.put("/dishes/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, category } = req.body;
  const dishes = readDishes();

  const index = dishes.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Dish not found" });
  }

  if (!name && !price && !category) {
    return res.status(400).json({ error: "At least one of name, price, or category must be provided" });
  }

  // Update fields if provided
  if (name) dishes[index].name = name;
  if (price) dishes[index].price = price;
  if (category) dishes[index].category = category;

  writeDishes(dishes);
  res.status(200).json(dishes[index]);
});

// DELETE /dishes/:id → Delete dish by ID
app.delete("/dishes/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let dishes = readDishes();

  const exists = dishes.some(d => d.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Dish not found" });
  }

  dishes = dishes.filter(d => d.id !== id);
  writeDishes(dishes);

  res.status(200).json({ message: "Dish deleted successfully" });
});

// GET /dishes/get?name=<dish_name> → Search dishes by name (partial, case-insensitive)
app.get("/dishes/get", (req, res) => {
  const queryName = req.query.name;
  if (!queryName) {
    return res.status(400).json({ error: "Name query parameter is required" });
  }

  const dishes = readDishes();
  const matched = dishes.filter(d =>
    d.name.toLowerCase().includes(queryName.toLowerCase())
  );

  if (matched.length === 0) {
    return res.status(404).json({ message: "No dishes found" });
  }

  res.status(200).json(matched);
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "404 Not Found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
