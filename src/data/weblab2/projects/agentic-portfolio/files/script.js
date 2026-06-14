// Maya's Portfolio scripts
console.log("Portfolio loaded");

// Greet visitors based on the time of day.
const hour = new Date().getHours();
const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
console.log(greeting + ", welcome to my portfolio!");
