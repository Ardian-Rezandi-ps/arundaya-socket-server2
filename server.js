const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Arundaya Socket Server2 is running ✅");
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joystick-move", (data) => {
    io.emit("joystick-move", data);
  });
	socket.on("controller-chat", (data) => {
    console.log("controller-chat", data);
    io.emit("controller-chat", data);   // broadcast ke semua client (web + Unity)
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
