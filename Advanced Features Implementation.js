const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

const DATA_FILE = path.resolve(__dirname, "tasks.json");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "task-manager> ",
});

let tasks = [];
let nextId = 1;

// User preferences (default: show all)
let preferences = {
  filterStatus: "all", // all, pending, completed
};

const commands = {
  "add-task": "Add a new task",
  "list-tasks": "List tasks (respects preferences)",
  "complete-task": "Mark a task as completed (by ID or exact title)",
  "update-task": "Update title or due date of a task (by ID or exact title)",
  "delete-task": "Delete a task (by ID or exact title)",
  "search-tasks": "Search tasks by title or due date",
  "set-preference": "Set display preferences (filter by status)",
  help: "Show this help message",
  exit: "Exit the application",
};

console.log("Welcome to Task Manager!");
console.log("Type 'help' to see available commands.");

// Utility functions for file I/O
async function loadData() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const obj = JSON.parse(data);
    tasks = obj.tasks || [];
    nextId = obj.nextId || 1;
    preferences = obj.preferences || preferences;
  } catch (err) {
    if (err.code === "ENOENT") {
      // File does not exist, start fresh
      tasks = [];
      nextId = 1;
      preferences = { filterStatus: "all" };
    } else {
      console.error("Error loading data:", err.message);
    }
  }
}

async function saveData() {
  try {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify({ tasks, nextId, preferences }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("Error saving data:", err.message);
  }
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

// Validation helpers
function isValidTitle(title) {
  return title.trim().length > 0;
}

function isValidDueDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function findTaskByIdOrTitle(identifier) {
  const id = Number(identifier);
  if (!isNaN(id)) {
    return tasks.find((t) => t.id === id);
  }
  return tasks.find((t) => t.title === identifier);
}

async function addTask() {
  try {
    const title = await ask("Enter task title: ");
    if (!isValidTitle(title)) {
      console.log("❌ Task title cannot be empty.");
      return;
    }

    const dueDate = await ask("Enter due date (YYYY-MM-DD): ");
    if (!isValidDueDate(dueDate)) {
      console.log("❌ Invalid date format. Use YYYY-MM-DD.");
      return;
    }

    tasks.push({
      id: nextId++,
      title,
      dueDate,
      status: "pending",
    });

    await saveData();
    console.log(`✅ Task "${title}" added successfully.`);
  } catch (err) {
    console.log("❌ Failed to add task:", err.message);
  }
}

function listTasks() {
  let filteredTasks = tasks;
  if (preferences.filterStatus === "pending") {
    filteredTasks = tasks.filter((t) => t.status === "pending");
  } else if (preferences.filterStatus === "completed") {
    filteredTasks = tasks.filter((t) => t.status === "completed");
  }

  if (filteredTasks.length === 0) {
    console.log("ℹ️ No tasks found.");
    return;
  }

  console.log("\nTasks:");
  console.log("ID | Title               | Due Date   | Status");
  console.log("---|---------------------|------------|---------");
  for (const t of filteredTasks) {
    console.log(
      `${t.id.toString().padEnd(2)} | ${t.title.padEnd(19)} | ${t.dueDate} | ${t.status}`
    );
  }
  console.log();
}

async function completeTask() {
  try {
    const identifier = await ask(
      "Enter task ID or exact task title to mark as complete: "
    );
    if (!identifier) {
      console.log("❌ You must enter a task ID or title.");
      return;
    }

    const task = findTaskByIdOrTitle(identifier);

    if (!task) {
      console.log("❌ Task not found.");
      return;
    }

    if (task.status === "completed") {
      console.log(`ℹ️ Task "${task.title}" is already completed.`);
      return;
    }

    task.status = "completed";
    await saveData();
    console.log(`✅ Task "${task.title}" marked as completed.`);
  } catch (err) {
    console.log("❌ Failed to complete task:", err.message);
  }
}

async function updateTask() {
  try {
    const identifier = await ask(
      "Enter task ID or exact task title to update: "
    );
    if (!identifier) {
      console.log("❌ You must enter a task ID or title.");
      return;
    }

    const task = findTaskByIdOrTitle(identifier);

    if (!task) {
      console.log("❌ Task not found.");
      return;
    }

    const newTitle = await ask(
      `Enter new title (leave empty to keep current: "${task.title}"): `
    );
    if (newTitle && !isValidTitle(newTitle)) {
      console.log("❌ Task title cannot be empty.");
      return;
    }

    const newDueDate = await ask(
      `Enter new due date (YYYY-MM-DD) (leave empty to keep current: ${task.dueDate}): `
    );
    if (newDueDate && !isValidDueDate(newDueDate)) {
      console.log("❌ Invalid date format. Use YYYY-MM-DD.");
      return;
    }

    if (newTitle) {
      task.title = newTitle;
    }
    if (newDueDate) {
      task.dueDate = newDueDate;
    }

    await saveData();
    console.log(`✅ Task "${task.title}" updated successfully.`);
  } catch (err) {
    console.log("❌ Failed to update task:", err.message);
  }
}

async function deleteTask() {
  try {
    const identifier = await ask(
      "Enter task ID or exact task title to delete: "
    );
    if (!identifier) {
      console.log("❌ You must enter a task ID or title.");
      return;
    }

    let taskIndex = -1;
    const id = Number(identifier);
    if (!isNaN(id)) {
      taskIndex = tasks.findIndex((t) => t.id === id);
    }
    if (taskIndex === -1) {
      taskIndex = tasks.findIndex((t) => t.title === identifier);
    }

    if (taskIndex === -1) {
      console.log("❌ Task not found.");
      return;
    }

    const deleted = tasks.splice(taskIndex, 1)[0];
    await saveData();
    console.log(`✅ Task "${deleted.title}" deleted successfully.`);
  } catch (err) {
    console.log("❌ Failed to delete task:", err.message);
  }
}

async function searchTasks() {
  try {
    const keyword = await ask(
      "Enter keyword to search in title or exact due date (YYYY-MM-DD): "
    );
    if (!keyword) {
      console.log("❌ Search keyword cannot be empty.");
      return;
    }

    const results = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(keyword.toLowerCase()) ||
        t.dueDate === keyword
    );

    if (results.length === 0) {
      console.log("ℹ️ No matching tasks found.");
      return;
    }

    listTasks(results);
  } catch (err) {
    console.log("❌ Failed to search tasks:", err.message);
  }
}

async function setPreference() {
  try {
    console.log(
      "Current filterStatus:",
      preferences.filterStatus,
      "(Options: all, pending, completed)"
    );
    const filter = await ask(
      "Enter task display filter (all, pending, completed): "
    );

    if (!["all", "pending", "completed"].includes(filter)) {
      console.log("❌ Invalid filter option.");
      return;
    }

    preferences.filterStatus = filter;
    await saveData();
    console.log(`✅ Preferences updated: filterStatus = "${filter}"`);
  } catch (err) {
    console.log("❌ Failed to set preferences:", err.message);
  }
}

function showHelp() {
  console.log("\nAvailable commands:");
  for (const [cmd, desc] of Object.entries(commands)) {
    console.log(`- ${cmd}: ${desc}`);
  }
  console.log();
}

async function handleCommand(cmd) {
  switch (cmd.trim()) {
    case "add-task":
      await addTask();
      break;
    case "list-tasks":
      listTasks();
      break;
    case "complete-task":
      await completeTask();
      break;
    case "update-task":
      await updateTask();
      break;
    case "delete-task":
      await deleteTask();
      break;
    case "search-tasks":
      await searchTasks();
      break;
    case "set-preference":
      await setPreference();
      break;
    case "help":
      showHelp();
      break;
    case "exit":
      console.log("👋 Exiting task manager. Goodbye!");
      rl.close();
      return false;
    default:
      console.log(
        `❌ Unknown command: "${cmd}". Type 'help' to see available commands.`
      );
  }
  return true;
}

async function main() {
  await loadData();
  rl.prompt();

  for await (const line of rl) {
    const shouldContinue = await handleCommand(line);
    if (!shouldContinue) break;
    rl.prompt();
  }
}

main();
