const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const rootDir = path.resolve(__dirname, "../");

const ensureWasmOutputDirExists = () => {
  console.log("Preparing wasm output folder...\n");

  const src = path.resolve(rootDir, "src/assets/wasm");
  if (fs.existsSync(src)) {
    const files = fs.readdirSync(src);
    for (let file of files) {
      fs.unlinkSync(path.join(src, file));
    }
  } else {
    fs.mkdirSync(src);
  }
};

const compileWasmSources = () => {
  console.log("Compiling wasm sources...");

  const wasmDir = path.resolve(rootDir, "src/app/wasm");
  for (let item of fs.readdirSync(wasmDir)) {
    const itemPath = path.join(wasmDir, item);
    if (!fs.lstatSync(itemPath).isDirectory()) {
      continue;
    }

    const buildFilePath = path.join(itemPath, "build-cmd.js");
    const { cmd } = require(buildFilePath);

    console.log("\nCompiling wasm source for", chalk.green(item));
    execSync(cmd, { cwd: rootDir, stdio: "inherit" });
  }
};

ensureWasmOutputDirExists();
compileWasmSources();
console.log("\nAll commands have been issued.");
