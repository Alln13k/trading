import { spawn } from "node:child_process";
import net from "node:net";

function portOpen() {
  return new Promise((resolve) => {
    const socket = net.connect(3000, "127.0.0.1", () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

const open = await portOpen();
if (open) {
  console.log("Next.js is already listening on port 3000");
  setInterval(() => {}, 1 << 30);
} else {
  const child = spawn("npm", ["run", "dev"], { stdio: "inherit" });
  const stop = () => {
    child.kill("SIGTERM");
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  child.on("exit", (code) => process.exit(code ?? 0));
}
