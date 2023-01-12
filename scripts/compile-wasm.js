const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const rootDir = path.resolve(__dirname, "../");

const exec = function(cmd, cb){
  console.log('>>>>>', cmd);
  // this would be way easier on a shell/bash script :P
  const child_process = require('child_process');
  // const parts = cmd.split(/\s+/g);
  // const p = child_process.spawn(parts[0], parts.slice(1), {stdio: 'inherit'});
  const parts = cmd.command.split(/\s+/g);
  const p = child_process.spawn(parts[0], parts.slice(1), cmd.options);
  // const p = child_process.spawn(cmd.command, cmd.options);
  p.on('exit', function(code){
    let err = null;
    if (code) {
      err = new Error('command "'+ cmd +'" exited with wrong status code "'+ code +'"');
      err.code = code;
      err.cmd = cmd;
    }
    if (cb) cb(err);
  });
};

const series = function(cmds, cb){
  const execNext = function () {
    exec(cmds.shift(), function (err) {
      if (err) {
        cb(err);
      } else {
        if (cmds.length) execNext();
        else cb(null);
      }
    });
  };
  execNext();
};

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

    // // fix for Windows
    // const formattedCmd = cmd.replace("$(pwd)", rootDir);

    console.log("\nCompiling wasm source for", chalk.green(item));
    // console.log(formattedCmd);
    // execSync(formattedCmd, { cwd: rootDir, stdio: "inherit" });

    // const cmds = ['/media/mgr/EDATA/CLionProjects/emsdk/emsdk_env.sh'];
    // cmds.push(cmd);
    // const cmds = [{command: 'cd /media/mgr/EDATA/CLionProjects/emsdk', options: {cwd: rootDir, stdio: "inherit"}}];
    // cmds.push({command: './emsdk_env.sh', options: {cwd: rootDir, stdio: "inherit"}});
    // cmds.push({command: `cd ${rootDir}`, options: {cwd: rootDir, stdio: "inherit"}});
    // cmds.push('cd /media/mgr/EDATA/WebstormProjects/angular-wasm');
    // cmds.push(cmd);
    // const cmds = [{command: 'eval $(./wasm-env.sh)', options: {cwd: rootDir, stdio: "inherit"}}];
    const cmds = [];
    cmds.push({command: cmd, options: {cwd: rootDir, stdio: "inherit"}});
    series(cmds, function(err) {
      if (err) {
        console.error(err);
      } else {
        console.log('executed many commands in a row');
      }
    });
  }
};

ensureWasmOutputDirExists();
compileWasmSources();
// console.log("\nAll sources have been successfully compiled.");
console.log("\nAll commands have been issued.");
