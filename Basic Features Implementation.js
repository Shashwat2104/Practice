const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(express.json());

// Utility: Read courses from db.json
function readCourses() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(data);
    return db.courses || [];
  } catch (err) {
    return [];
  }
}

// Utility: Write courses to db.json
function writeCourses(courses) {
  const db = { courses };
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// POST /courses - Create a course
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

// Start server
app.listen(PORT, () => {
  console.log(`LMS server is running on http://localhost:${PORT}`);
});
