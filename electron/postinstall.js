/**
 * MasaPOS Pro - Post-install script
 * This is executed after npm install on Windows to help build the .exe
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🌽 MasaPOS Pro - Post-install");
console.log("================================");

// Check if .next exists (already built)
const nextPath = path.join(__dirname, "..", ".next");
if (!fs.existsSync(nextPath)) {
  console.log("⚠️  .next folder not found. Building Next.js app...");
  try {
    execSync("npm run build", { cwd: path.join(__dirname, ".."), stdio: "inherit" });
    console.log("✅ App built successfully!");
  } catch (err) {
    console.error("❌ Build failed:", err.message);
    console.log("   Run 'npm run build' manually.");
  }
} else {
  console.log("✅ .next folder found - app already built");
}

console.log("");
console.log("📦 To generate the Windows .exe installer, run:");
console.log("   npm run electron:build:win");
console.log("");
console.log("   The .exe will be in the 'release/' folder");
console.log("================================");
