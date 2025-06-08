const express = require("express");
const app = express();

const PORT = 3000;

// Route: GET /home → HTML response
app.get("/home", (req, res) => {
  res.status(200).send("<h1>Welcome to Home Page</h1>");
});

// Route: GET /aboutus → JSON response
app.get("/aboutus", (req, res) => {
  res.status(200).json({ message: "Welcome to About Us" });
});

// Route: GET /contactus → dummy contact details JSON response
app.get("/contactus", (req, res) => {
  res.status(200).json({
    phone: "+1-234-567-890",
    email: "contact@example.com",
    address: "1234 Elm Street, Springfield, USA",
  });
});

// Handle undefined routes with 404
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
