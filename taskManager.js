const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "task-manager> ",
});

let tasks = [];
let nextId = 1;

console.log("Welcome to Task Manager!");
console.log("Commands: add-task, list-tasks, complete-task, exit");

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function addTask() {
  const title = await ask("Enter task title: ");
  if (!title) {
    console.log("Task title cannot be empty.");
    return;
  }

  const dueDate = await ask("Enter due date (YYYY-MM-DD): ");
  if (!dueDate) {
    console.log("Due date cannot be empty.");
    return;
  }

  // Simple date format validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    console.log("Invalid date format. Use YYYY-MM-DD.");
    return;
  }

  tasks.push({
    id: nextId++,
    title,
    dueDate,
    status: "pending",
  });

  console.log(`Task "${title}" added successfully.`);
}

function listTasks() {
  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }

  console.log("\nTasks:");
  console.log("ID | Title               | Due Date   | Status");
  console.log("---|---------------------|------------|---------");
  for (const t of tasks) {
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
    console.log("You must enter a task ID or title.");
    return;
  }

  let task = null;

  // Try ID match
  const id = Number(identifier);
  if (!isNaN(id)) {
    task = tasks.find((t) => t.id === id);
  }

  // Try title match if not found by ID
  if (!task) {
    task = tasks.find((t) => t.title === identifier);
  }

  if (!task) {
    console.log("Task not found.");
    return;
  }

  if (task.status === "completed") {
    console.log(`Task "${task.title}" is already completed.`);
    return;
  }

  task.status = "completed";
  console.log(`Task "${task.title}" marked as completed.`);
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
    case "exit":
      console.log("Exiting task manager. Goodbye!");
      rl.close();
      return false;
    default:
      console.log(`Unknown command: "${cmd}". Try add-task, list-tasks, complete-task, or exit.`);
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
