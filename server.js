import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// PORT dari Railway, fallback ke 3000 saat lokal
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Endpoint HTTP biasa, biar bisa dicek di browser
app.get("/", (req, res) => {
  res.send("Arundaya Socket Server is running ✅");
});

// Event Socket.IO
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-controller", (data) => {
    console.log("join-controller", data);
    io.emit("join-controller", data);
  });

  socket.on("joystick-move", (data) => {
    io.emit("joystick-move", data);
  });

  socket.on("controller-status", (data) => {
    io.emit("controller-status", data);
  });

  socket.on("controller-chat", (data) => {
    io.emit("controller-chat", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log("Socket.IO server running on port", PORT);
});
