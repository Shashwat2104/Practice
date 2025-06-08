import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(express.json());

// Utils
const readCourses = () => {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(data);
    return db.courses || [];
  } catch {
    return [];
  }
};

const writeCourses = (courses) => {
  fs.writeFileSync(DB_PATH, JSON.stringify({ courses }, null, 2));
};

// Validation middleware
const validateCourse = (req, res, next) => {
  const { title, description } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required and cannot be empty." });
  }
  if (!description || description.trim() === "") {
    return res.status(400).json({ error: "Description is required and cannot be empty." });
  }
  next();
};

// POST /courses - Create course
app.post("/courses", validateCourse, (req, res) => {
  const { title, description } = req.body;

  const courses = readCourses();
  const newId = courses.length ? Math.max(...courses.map(c => c.id)) + 1 : 1;

  const newCourse = { id: newId, title: title.trim(), description: description.trim() };
  courses.push(newCourse);

  writeCourses(courses);

  res.status(201).json({ message: "Course added successfully", course: newCourse });
});

// GET /courses - Get all courses
app.get("/courses", (req, res) => {
  const courses = readCourses();
  res.status(200).json(courses);
});

// PUT /courses/:id - Update course by ID with validation
app.put("/courses/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description } = req.body;

  if ((!title || title.trim() === "") && (!description || description.trim() === "")) {
    return res.status(400).json({ error: "Please provide title or description to update (cannot be empty)." });
  }

  const courses = readCourses();
  const index = courses.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Course not found." });
  }

  if (title && title.trim() !== "") courses[index].title = title.trim();
  if (description && description.trim() !== "") courses[index].description = description.trim();

  writeCourses(courses);

  res.status(200).json({ message: "Course updated successfully", course: courses[index] });
});

// DELETE /courses/:id - Delete course by ID
app.delete("/courses/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let courses = readCourses();

  if (!courses.some(c => c.id === id)) {
    return res.status(404).json({ error: "Course not found." });
  }

  courses = courses.filter(c => c.id !== id);
  writeCourses(courses);

  res.status(200).json({ message: "Course deleted successfully." });
});

// GET /courses/search?title= - Search courses by title (case-insensitive partial match)
app.get("/courses/search", (req, res) => {
  const { title } = req.query;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Please provide a valid title to search." });
  }
  const courses = readCourses();
  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(title.trim().toLowerCase())
  );

  if (filtered.length === 0) {
    return res.status(404).json({ message: "No courses found matching the title." });
  }

  res.status(200).json(filtered);
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "404 Not Found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`LMS server running at http://localhost:${PORT}`);
});
