const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

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

// endpoint HTTP untuk tes di browser
app.get("/", (req, res) => {
  res.send("Arundaya Socket Server2 is running ✅");
});

// event Socket.IO
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
