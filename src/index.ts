#!/usr/bin/env node
import WebSocket from "ws"; // install: npm install ws
import inquirer from "inquirer"; // install: npm install inquirer
import ora from "ora"; // install: npm install ora
import chalk from "chalk";
import chalkTemplate from "chalk-template"; // install: npm install chalk-template@1
// import {} } from "jose"; // install: npm install jose
// import { sign } from "jose";
const BASE_HOST = "proxy.ayooub.me"; // remote server
// const BASE_HOST = "localhost:8787"; // remote server

const isProxyAvailable = async (proxy: string) => {
  try {
    let res = await fetch(`http://${BASE_HOST}/is-available/${proxy}`, {
      method: "GET",
      headers: {
        client: "dotunnel-node-cli-client",
      },
    });
    let data = await res.json();
    const available = data.available;
    if (available) {
      return true;
    }
  } catch (error) {
    console.error("Error checking proxy availability form KV ", error);
    return false;
  }

  return false;
};

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
      message: "Enter a name for the proxy (e.g., todo):",
      validate: async (input) => {
        // Only allow valid subdomain characters: a-z, 0-9, and hyphens (no leading/trailing hyphens, max 63 chars)
        const subdomain = input
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "")
          .replace(/^-+|-+$/g, "")
          .slice(0, 63);

        if (subdomain !== input) {
          return "Proxy name must be a valid subdomain (letters, numbers, hyphens, max 63 chars, no leading/trailing hyphens).";
        }
        if (!input || input.trim() === "") {
          return "Proxy name cannot be empty";
        }
        const available = await isProxyAvailable(subdomain);
        return available || "Proxy name is already taken , Choose another one.";
      },
    },
  ]);
  return answers.proxyName.trim();
};
const getOpenPorts = async () => {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "port",
      message: "Enter the local port of the service to expose (e.g., 8000):",
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

function createBanner(toolName: string, width: number | null = null): string {
  // Auto-size width if not provided
  if (!width) {
    width = toolName.length + 6; // 3 spaces padding on each side
  }

  // Ensure minimum width
  width = Math.max(width, toolName.length + 6);

  // Calculate padding
  const totalPadding = width - toolName.length - 2; // -2 for border characters
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;

  // Create banner lines
  const topLine = "╭" + "─".repeat(width - 2) + "╮";

  const bottomLine = "╰" + "─".repeat(width - 2) + "╯";

  return (
    chalk.cyan(topLine) +
    "\n" +
    chalk.cyan("│") +
    chalk.bold.white(
      " ".repeat(leftPadding) + chalk.cyan(toolName) + " ".repeat(rightPadding)
    ) +
    chalk.cyan("│") +
    "\n" +
    chalk.cyan(bottomLine)
  );
}

// Example banner showing local service to public URL mapping
function showExampleBanner() {
  const localUrl = chalk.bold.cyan("http://localhost:8000");
  const arrow = chalk.bold.yellow("→");
  const publicUrl = chalk.bold.green("https://todo-prxy.ayooub.me");

  console.log("");
  console.log(chalk.bold.blue("Example:"));
  console.log(` ${localUrl} ${arrow} ${publicUrl}`);
  console.log("");
}

function showBanner() {
  //   const banner = chalkTemplate`
  // {bold.cyan  ╭—————————————————————————————————————————————————————————————╮}
  // {bold.cyan  │                                                              │}
  // {bold.cyan  │   {bold.yellow 🚀 Welcome to Cloudflare Tunnel Client 🚀}   │}
  // {bold.cyan  │                                                              │}
  // {bold.cyan  ╰——————————————————————————————————————————————————————————————╯}
  //   `;
  // Create the main banner

  // Add a slogan/description
  console.log("");
  console.log(
    chalk.bold.yellow(
      "Expose your localhost to the world easily — no firewall or port forwarding pain!"
    )
  );
  console.log("");

  console.log(chalk.greenBright("Fast • Secure • Simple"));
  console.log("");
  console.log(createBanner(" Welcome to DoTunnel client 🚀", 50));
  showExampleBanner();

  console.log("");
  // // Add bullet points or keywords
  // console.log(

  // );
  // console.log(banner);
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

async function main() {
  showBanner();
  const LOCAL_BASE = `http://localhost:${await getOpenPorts()}`; // local service

  const PROXY_NAME = await getProxyName();

  // const WS_URL = `ws://${BASE_HOST}/register/${PROXY_NAME}`; // remote websocket server
  const WS_URL = `wss://${BASE_HOST}/register/${PROXY_NAME}`; // remote websocket server

  console.debug("connection with ", WS_URL);

  const spinner = ora(`Connecting to our proxy server...`).start();

  const launchproxy = async () => {
    let ws: WebSocket | null;
    try {
      ws = new WebSocket(WS_URL, {
        headers: {
          client: "dotunnel-node-cli-client",
        },
      });
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      return;
    }

    ws.on("unexpected-response", (req, res) => {
      spinner.fail();
      console.debug(
        chalk.red(
          `❌ Connection failed with status ${res.statusCode} ${res.statusMessage}`
        )
      );

      if (res.statusCode === 409) {
        console.error(chalk.red("❌ Proxy name is already taken."));
        // awaitgetProxyName()
        process.exit(1);
      } else {
        console.error(
          chalk.red("❌ Unable to connect to the server. Please retry later.")
        );
      }
      ws!.close();
    });

    ws!.on("open", async () => {
      spinner.succeed();
      console.log(`🌐 Forwarding to: ${chalk.cyan(LOCAL_BASE)}`);
      console.log(
        `🔗 Public URL:    ${chalk.cyan(
          `https://${PROXY_NAME}-prxy.ayooub.me`
        )}`
      );
      console.log("")
      console.log("")
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
            chalk.yellow(
              ` ⚠  WebSocket upgrade requests are not supported yet.`
            )
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
        const tunnelres = JSON.stringify({
          id,
          status: res!.status,

          headers: Object.fromEntries(res!.headers.entries()),
          body: responseBody,
          isBinary: isBinaryResponse,
        });

        const tunnelresSize = Buffer.byteLength(tunnelres, "utf8");
        if (tunnelresSize > 1024 * 1024) {
          console.debug(
            `📤 Message too large : req with id ${id} and size ${tunnelresSize} bytes !!
            `
          );

          console.log(
            `[${headers?.["x-real-ip"]}] ${chalk[statusColor](
              res!.status
            )}  ${method}  > ${path} ${chalk.red("too large !!")} `
          );

          return;
        }
        console.log(
          `[${headers?.["x-real-ip"]}] ${chalk[statusColor](
            res!.status
          )}  ${method}  > ${path}  ` 
        );

        ws.send(tunnelres);

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

    ws.on("close", async (code, reason) => {
      console.log(chalk.red("❌ Connection to the server is  closed"));
      console.debug(
        `❌ Disconnected from WebSocket server: ${code} - ${reason}`
      );

      if (code === 1009) {
        console.log(
          chalk.red(
            "❌ Message too big. Please try to reduce the size of your requests."
          )
        );
        console.log(chalk.yellow("🔁 Retrying ..."));
        setTimeout(() => {
          launchproxy();
        }, 1000);
      }
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log(" Shutting down...");
      try {
        ws.close(1000, "client-closed");
      } catch {
        // ignore
      }
      setTimeout(() => process.exit(0), 500);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  };

  launchproxy();
}

main().catch((err) => {
  // console.error("❌ Fatal error:", err);
  // process.on([""]
  // ,)
  if (err?.name === "ExitPromptError") {
    console.log(chalk.yellow("👋 Prompt cancelled by user."));
    process.exit(0);
  }
  process.exit(1);
});
