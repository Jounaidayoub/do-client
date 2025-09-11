import WebSocket from "ws"; // install: npm install ws
// import fetch from "node-fetch"; // install: npm install node-fetch

// const WS_URL = "ws://localhost:8787/nisada"; // remote websocket server
const WS_URL = "wss://proxy.ayooub.me/user1"; // remote websocket server

const LOCAL_BASE = "http://localhost:3000"; // local service

const ws = new WebSocket(WS_URL);

ws.on("open", () => {
  console.log("✅ Connected to WebSocket server");
  console.log("🌐 Forwarding requests to:", LOCAL_BASE);
  console.log("u can access the remote ws server at:", "");
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
