import WebSocket from "ws"; // install: npm install ws
import inquirer from "inquirer"; // install: npm install inquirer

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
      validate: (input) => {
        const port = parseInt(input, 10);
        return (
          (port > 0 && port < 65536) ||
          "Please enter a valid port number (1-65535)"
        );
      },
    },
  ]);
  return parseInt(answers.port, 10);
};

// const WS_URL = "ws://localhost:8787/user1"; // remote websocket server
const PROXY_NAME = await getProxyName();

const WS_URL = `wss://proxy.ayooub.me/${PROXY_NAME}`; // remote websocket server

const LOCAL_BASE = `http://localhost:${await getOpenPorts()}`; // local service
console.log("connection with ", WS_URL);

const ws = new WebSocket(WS_URL);
const launchproxy = async () => {
  ws.on("open", async () => {
    console.log("✅ Connected to WebSocket server");
    console.log("🌐 Forwarding requests to:", LOCAL_BASE);
    console.log(
      "You can access your proxy from:",
      `https://${PROXY_NAME}-prxy.ayooub.me`
    );
  });

  ws.on("message", async (data) => {
    try {
      // Parse incoming message
      console.log("📩 Raw message data:", data.toString());
      const msg = JSON.parse(data.toString());

      console.log("📩 Received message:", msg);

      // Expect something like: { id: "123", path: "/api/test", method: "GET", body: {...} }
      const { id, path, method, body, headers } = msg;

      // Forward to local service
      const res = await fetch(`${LOCAL_BASE}${path}`, {
        method: method || "GET",
        headers: {
          // "Content-Type": "application/json",
          ...(headers || {}),
        },
        body: method !== "GET" ? JSON.stringify(body || {}) : undefined,
      });

      const contentType = res.headers.get("content-type") || "";
      const isBinaryResponse =
        contentType.includes("image/") ||
        contentType.includes("audio/") ||
        contentType.includes("video/") ||
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/pdf");

      let responseBody;
      if (isBinaryResponse) {
        console.log("📩 Handling binary response");
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        responseBody = buffer.toString("base64");
      } else {
        responseBody = await res.text();
      }

      // Send response back
      ws.send(
        JSON.stringify({
          id,
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          body: responseBody,
          isBinary: isBinaryResponse,
        })
      );
      console.log(`✅ Handled request ${id} with status ${res.status}`);
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
    console.log(`❌ Disconnected from WebSocket server: ${code} - ${reason}`);
  });
};

launchproxy();
