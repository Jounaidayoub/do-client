import WebSocket from "ws"; // install: npm install ws
import inquirer from "inquirer"; // install: npm install inquirer
import ora from "ora"; // install: npm install ora
import chalk from "chalk";
import chalkTemplate from "chalk-template"; // install: npm install chalk-template@1

const isPortopen = async (port: number) => {
  try {
    const res = await fetch(`http://localhost:${port}`);
  } catch (err) {
    return false;
  }
  return true;
};

const getProxyName = async () => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "proxyName",
      message: "Enter a name for the proxy (e.g., user1):",
      validate: (input) => input.trim() !== "" || "Proxy name cannot be empty",
    },
  ]);
  return answers.proxyName.trim();
};

const getOpenPorts = async () => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "port",
      message: "Enter the local port of the service to expose (e.g., 3000):",
      validate: async (input) => {
        const port = parseInt(input, 10);
        if (isNaN(port)) {
          return "Please enter a valid port number.";
        }
        const isOpen = await isPortopen(port);
        return isOpen || "Port is not open.";
      },
    },
  ]);
  return parseInt(answers.port, 10);
};

function showBanner() {
  const banner = chalkTemplate`
{bold.cyan  ╭—————————————————————————————————————————————————————————————╮}
{bold.cyan  │                                                              │}
{bold.cyan  │   {bold.yellow 🚀 Welcome to Cloudflare Tunnel Client 🚀}   │}
{bold.cyan  │                                                              │}
{bold.cyan  ╰——————————————————————————————————————————————————————————————╯}
  `;
  console.log(banner);
}
function getStatusColor(status: number): "green" | "yellow" | "red" | "gray" {
  if (status >= 500) return "red";
  if (status >= 400) return "yellow";
  if (status >= 300) return "gray";
  if (status >= 200) return "green";
  return "gray";
}
let DEBUG = false;

if (process.env.DEBUG === "true") {
  console.log("DEBUG mode is ON");
  DEBUG = true;
}

console.debug = (...args) => {
  if (DEBUG) {
    console.log("[DEBUG]", ...args);
  }
};

showBanner();
// const WS_URL = "ws://localhost:8787/user1"; // remote websocket server
const PROXY_NAME = await getProxyName();

const WS_URL = `wss://proxy.ayooub.me/${PROXY_NAME}`; // remote websocket server

const LOCAL_BASE = `http://localhost:${await getOpenPorts()}`; // local service
console.log("connection with ", WS_URL);

const spinner = ora(`Connecting to ${chalk.bold(WS_URL)}...`).start();

const launchproxy = async () => {
  const ws = new WebSocket(WS_URL);
  ws.on("open", async () => {
    spinner.succeed();
    console.log(`🌐 Forwarding to: ${chalk.cyan(LOCAL_BASE)}`);
    console.log(
      `🔗 Public URL:    ${chalk.cyan(`https://${PROXY_NAME}-prxy.ayooub.me`)}`
    );
  });

  ws.on("message", async (data) => {
    try {
      // Parse incoming message
      console.debug("📩 Raw message data:", data.toString());
      const msg = JSON.parse(data.toString());

      console.debug("📩 Received message:", msg);

      // Expect something like: { id: "123", path: "/api/test", method: "GET", body: {...} }
      const { id, path, method, body, headers } = msg;

      // Forward to local service
      console.debug("headers connection", headers.connection);
      if (headers?.connection === "Upgrade") {
        // ++++++++ TODO ++++++++++
        // ++++++++ TODO ++++++++++

        // we goonna handle this later
        // we are not supporting websocket for now
        // alot of dev servers will use this  for HMR

        console.log(
          chalk.yellow(` ⚠  WebSocket upgrade requests are not supported yet.`)
        );
        return;
      }

      let res;
      try {
        res = await fetch(`${LOCAL_BASE}${path}`, {
          method: method || "GET",
          headers: {
            // "Content-Type": "application/json",
            ...(headers || {}),
          },
          body: method !== "GET" ? JSON.stringify(body || {}) : null,
        });
      } catch (err) {
        console.log(
          chalk.red(
            "❌ The local service on this port is not running or unreachable."
          )
        );
        console.log(
          chalk.yellow(
            "ℹ️ Please make sure your local server is running on",
            LOCAL_BASE
          )
        );
        console.debug("Error details:", err);

        return;
      }
      const statusColor = getStatusColor(res!.status);
      console.log(
        `[${headers?.["x-real-ip"]}] ${chalk[statusColor](
          res!.status
        )}  ${method}  > ${path}  `
      );

      const contentType = res!.headers.get("content-type") || "";
      const isBinaryResponse =
        contentType.includes("image/") ||
        contentType.includes("audio/") ||
        contentType.includes("video/") ||
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/pdf");

      let responseBody;
      if (isBinaryResponse) {
        console.debug("📩 Handling binary response");
        const arrayBuffer = await res!.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        responseBody = buffer.toString("base64");
      } else {
        responseBody = await res!.text();
      }

      // Send response back
      ws.send(
        JSON.stringify({
          id,
          status: res!.status,

          headers: Object.fromEntries(res!.headers.entries()),
          body: responseBody,
          isBinary: isBinaryResponse,
        })
      );
      console.debug(`✅ Handled request ${id} with status ${res!.status}`);
    } catch (err) {
      console.error("❌ Error handling message:", err);
      // ws.send(
      //   JSON.stringify({
      //     error: "Failed to process request",
      //     details: (err as Error).message,
      //   })
      // );
    }
  });

  ws.on("close", (code, reason) => {
    console.log(chalk.red("❌ Connection to the server is  closed"));
    console.debug(`❌ Disconnected from WebSocket server: ${code} - ${reason}`);

    if (code === 1009) {
      console.log(
        chalk.red(
          "❌ Message too big. Please try to reduce the size of your requests."
        )
      );
      console.log(chalk.yellow("🔁 Retrying ..."));
      launchproxy();
    }
  });
};

launchproxy();
