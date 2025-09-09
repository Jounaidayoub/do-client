import WebSocket from "ws"; // install: npm install ws
// import fetch from "node-fetch"; // install: npm install node-fetch

const WS_URL = "ws://localhost:8787/nisada"; // remote websocket server
const LOCAL_BASE = "http://localhost:3000"; // local service

const ws = new WebSocket(WS_URL);

ws.on("open", () => {
  console.log("✅ Connected to WebSocket server");
});

ws.on("message", async (data) => {
  try {
    // Parse incoming message
    const msg = JSON.parse(data.toString());

    console.log("📩 Received message:", msg);

    // Expect something like: { id: "123", path: "/api/test", method: "GET", body: {...} }
    const { id, path, method, body, headers } = msg;

    // Forward to local service
    const res = await fetch(`${LOCAL_BASE}${path}`, {
      method: method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: method !== "GET" ? JSON.stringify(body || {}) : undefined,
    });

    const text = await res.text();

    // Send response back
    ws.send(
      JSON.stringify({
        id,
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body: text,
      })
    );
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

ws.on("close", () => {
  console.log("❌ Disconnected from WebSocket server");
});
