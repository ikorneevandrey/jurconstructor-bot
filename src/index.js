console.log("=== TEST BOT STARTED ===");
console.log("Node version:", process.version);
console.log("BOT_TOKEN:", process.env.BOT_TOKEN ? "EXISTS" : "MISSING!");

// Простая проверка что бот может запуститься
if (!process.env.BOT_TOKEN) {
    console.error("ERROR: BOT_TOKEN is required!");
    process.exit(1);
}

console.log("=== BOT WOULD START SUCCESSFULLY ===");
process.exit(0);
