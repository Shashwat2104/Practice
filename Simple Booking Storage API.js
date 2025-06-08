const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(express.json());

// Utility to read books from db.json
function readBooks() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Utility to write books to db.json
function writeBooks(books) {
  fs.writeFileSync(DB_PATH, JSON.stringify(books, null, 2));
}

// POST /books → Add a new book
app.post("/books", (req, res) => {
  const { title, author, year } = req.body;
  if (!title || !author || !year) {
    return res.status(400).json({ error: "Title, author, and year are required" });
  }

  const books = readBooks();
  const newId = books.length ? Math.max(...books.map(b => b.id)) + 1 : 1;
  const newBook = { id: newId, title, author, year };
  books.push(newBook);
  writeBooks(books);

  res.status(201).json(newBook);
});

// GET /books → Get all books
app.get("/books", (req, res) => {
  const books = readBooks();
  res.status(200).json(books);
});

// GET /books/:id → Get book by ID
app.get("/books/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const books = readBooks();
  const book = books.find(b => b.id === id);

  if (!book) return res.status(404).json({ error: "Book not found" });

  res.status(200).json(book);
});

// PUT /books/:id → Update book by ID
app.put("/books/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, author, year } = req.body;

  if (!title && !author && !year) {
    return res.status(400).json({ error: "At least one of title, author or year must be provided" });
  }

  const books = readBooks();
  const index = books.findIndex(b => b.id === id);

  if (index === -1) return res.status(404).json({ error: "Book not found" });

  if (title) books[index].title = title;
  if (author) books[index].author = author;
  if (year) books[index].year = year;

  writeBooks(books);
  res.status(200).json(books[index]);
});

// DELETE /books/:id → Delete book by ID
app.delete("/books/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let books = readBooks();

  if (!books.some(b => b.id === id)) {
    return res.status(404).json({ error: "Book not found" });
  }

  books = books.filter(b => b.id !== id);
  writeBooks(books);

  res.status(200).json({ message: "Book deleted successfully" });
});

// GET /books/search?author=...&title=... → Search by author and/or title (partial, case-insensitive)
app.get("/books/search", (req, res) => {
  const { author, title } = req.query;

  if (!author && !title) {
    return res.status(400).json({ error: "At least one search query parameter (author or title) is required" });
  }

  const books = readBooks();

  const filtered = books.filter(book => {
    const matchAuthor = author ? book.author.toLowerCase().includes(author.toLowerCase()) : true;
    const matchTitle = title ? book.title.toLowerCase().includes(title.toLowerCase()) : true;
    return matchAuthor && matchTitle;
  });

  if (filtered.length === 0) {
    return res.status(404).json({ message: "No books found" });
  }

  res.status(200).json(filtered);
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "404 Not Found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
