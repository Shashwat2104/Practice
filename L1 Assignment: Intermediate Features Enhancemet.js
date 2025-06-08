const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(express.json());

// Utils
function readCourses() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(data);
    return db.courses || [];
  } catch {
    return [];
  }
}

function writeCourses(courses) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ courses }, null, 2));
}

// POST /courses - Create course (same as before)
app.post("/courses", (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  const courses = readCourses();
  const newId = courses.length ? Math.max(...courses.map(c => c.id)) + 1 : 1;

  const newCourse = { id: newId, title, description };
  courses.push(newCourse);

  writeCourses(courses);

  res.status(201).json({ message: "Course added successfully", course: newCourse });
});

// GET /courses - Get all courses
app.get("/courses", (req, res) => {
  const courses = readCourses();
  res.status(200).json(courses);
});

// PUT /courses/:id - Update course by ID
app.put("/courses/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description } = req.body;

  if (!title && !description) {
    return res.status(400).json({ error: "Please provide title or description to update." });
  }

  const courses = readCourses();
  const index = courses.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Course not found." });
  }

  if (title) courses[index].title = title;
  if (description) courses[index].description = description;

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

// Start server
app.listen(PORT, () => {
  console.log(`LMS server running at http://localhost:${PORT}`);
});
