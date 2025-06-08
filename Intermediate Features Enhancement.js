const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "task-manager> ",
});

let tasks = [];
let nextId = 1;

const commands = {
  "add-task": "Add a new task",
  "list-tasks": "List all tasks",
  "complete-task": "Mark a task as completed (by ID or exact title)",
  "update-task": "Update title or due date of a task (by ID or exact title)",
  "delete-task": "Delete a task (by ID or exact title)",
  "search-tasks": "Search tasks by title or due date",
  help: "Show this help message",
  exit: "Exit the application",
};

console.log("Welcome to Task Manager!");
console.log("Type 'help' to see available commands.");

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function addTask() {
  const title = await ask("Enter task title: ");
  if (!title) {
    console.log("❌ Task title cannot be empty.");
    return;
  }

  const dueDate = await ask("Enter due date (YYYY-MM-DD): ");
  if (!dueDate) {
    console.log("❌ Due date cannot be empty.");
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    console.log("❌ Invalid date format. Use YYYY-MM-DD.");
    return;
  }

  tasks.push({
    id: nextId++,
    title,
    dueDate,
    status: "pending",
  });

  console.log(`✅ Task "${title}" added successfully.`);
}

function listTasks(tasksToShow = tasks) {
  if (tasksToShow.length === 0) {
    console.log("ℹ️ No tasks found.");
    return;
  }

  console.log("\nTasks:");
  console.log("ID | Title               | Due Date   | Status");
  console.log("---|---------------------|------------|---------");
  for (const t of tasksToShow) {
    console.log(
      `${t.id.toString().padEnd(2)} | ${t.title.padEnd(19)} | ${t.dueDate} | ${t.status}`
    );
  }
  console.log();
}

async function completeTask() {
  const identifier = await ask(
    "Enter task ID or exact task title to mark as complete: "
  );

  if (!identifier) {
    console.log("❌ You must enter a task ID or title.");
    return;
  }

  let task = findTaskByIdOrTitle(identifier);

  if (!task) {
    console.log("❌ Task not found.");
    return;
  }

  if (task.status === "completed") {
    console.log(`ℹ️ Task "${task.title}" is already completed.`);
    return;
  }

  task.status = "completed";
  console.log(`✅ Task "${task.title}" marked as completed.`);
}

function findTaskByIdOrTitle(identifier) {
  const id = Number(identifier);
  if (!isNaN(id)) {
    return tasks.find((t) => t.id === id);
  }
  return tasks.find((t) => t.title === identifier);
}

async function updateTask() {
  const identifier = await ask(
    "Enter task ID or exact task title to update: "
  );
  if (!identifier) {
    console.log("❌ You must enter a task ID or title.");
    return;
  }

  let task = findTaskByIdOrTitle(identifier);

  if (!task) {
    console.log("❌ Task not found.");
    return;
  }

  const newTitle = await ask(
    `Enter new title (leave empty to keep current: "${task.title}"): `
  );
  const newDueDate = await ask(
    `Enter new due date (YYYY-MM-DD) (leave empty to keep current: ${task.dueDate}): `
  );

  if (newTitle) {
    task.title = newTitle;
  }

  if (newDueDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDueDate)) {
      console.log("❌ Invalid date format. Use YYYY-MM-DD.");
      return;
    }
    task.dueDate = newDueDate;
  }

  console.log(`✅ Task "${task.title}" updated successfully.`);
}

async function deleteTask() {
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
  console.log(`✅ Task "${deleted.title}" deleted successfully.`);
}

async function searchTasks() {
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
  rl.prompt();

  for await (const line of rl) {
    const shouldContinue = await handleCommand(line);
    if (!shouldContinue) break;
    rl.prompt();
  }
}

main();
