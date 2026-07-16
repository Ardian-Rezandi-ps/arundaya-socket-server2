const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

app.get("/", (req, res) => {
  res.send("Arundaya Socket Server2 is running ✅");
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id, "transport:", socket.conn.transport.name);

  socket.on("joystick-move", (data) => {
    console.log("forwarding joystick-move", socket.id, data);
    socket.broadcast.emit("joystick-move", data);
  });

  socket.on("controller-chat", (data) => {
    console.log("controller-chat", data);
    io.emit("controller-chat", data);
  });

  socket.on("player-input", (data = {}) => {
    const payload = {
      interact: data.interact ?? "",
      idPlayer: data.idPlayer ?? "",
      note: data.note ?? "",
      coin: Number.isInteger(data.coin) ? data.coin : 0,
    };

    console.log("player-input", payload);
    io.emit("player-input", payload);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, HOST, () => {
  console.log("Server running on http://" + HOST + ":" + PORT);
});
