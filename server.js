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

const players = new Map();

function isObject(data) {
  return data !== null && typeof data === "object" && !Array.isArray(data);
}

function getPlayerId(data) {
  if (!isObject(data) || typeof data.idPlayer !== "string") {
    return "";
  }

  const idPlayer = data.idPlayer.trim();
  return idPlayer.length > 0 && idPlayer.length <= 64 ? idPlayer : "";
}

function reportPlayerError(socket, code, message) {
  socket.emit("player-error", { code, message });
}

function getPlayersList() {
  return Array.from(players.values(), ({ idPlayer, x, y, rotation }) => ({
    idPlayer,
    x,
    y,
    rotation,
  }));
}

function registerPlayer(socket, idPlayer, data = {}, sendPlayersList = false) {
  const currentId = socket.data.idPlayer;
  if (currentId && currentId !== idPlayer) {
    reportPlayerError(socket, "PLAYER_ALREADY_ASSIGNED", "This connection already controls a player.");
    return null;
  }

  const existingPlayer = players.get(idPlayer);
  if (existingPlayer && existingPlayer.socketId !== socket.id) {
    reportPlayerError(socket, "PLAYER_ID_IN_USE", "This player ID is already connected.");
    return null;
  }

  if (!existingPlayer) {
    const player = {
      idPlayer,
      x: Number.isFinite(data.x) ? data.x : 0,
      y: Number.isFinite(data.y) ? data.y : 0,
      rotation: Number.isFinite(data.rotation) ? data.rotation : 0,
      socketId: socket.id,
    };
    players.set(idPlayer, player);
    socket.data.idPlayer = idPlayer;
    socket.broadcast.emit("player-joined", {
      idPlayer: player.idPlayer,
      x: player.x,
      y: player.y,
      rotation: player.rotation,
    });
  }

  if (sendPlayersList) {
    socket.emit("players-list", getPlayersList());
  }

  return players.get(idPlayer);
}

function getSocketPlayer(socket, data) {
  const idPlayer = getPlayerId(data) || socket.data.idPlayer;
  if (!idPlayer) {
    reportPlayerError(socket, "PLAYER_NOT_REGISTERED", "Join with a player ID before sending controls.");
    return null;
  }

  if (socket.data.idPlayer && socket.data.idPlayer !== idPlayer) {
    reportPlayerError(socket, "PLAYER_ID_MISMATCH", "This connection can only control its assigned player.");
    return null;
  }

  return registerPlayer(socket, idPlayer, isObject(data) ? data : {});
}

app.get("/", (req, res) => {
  res.send("Arundaya Socket Server2 is running ✅");
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id, "transport:", socket.conn.transport.name);

  socket.on("players-request", () => {
    socket.emit("players-list", getPlayersList());
  });

  socket.on("player-join", (data = {}) => {
    const idPlayer = getPlayerId(data);
    if (!idPlayer) {
      reportPlayerError(socket, "INVALID_PLAYER_ID", "Provide a player ID between 1 and 64 characters.");
      return;
    }

    registerPlayer(socket, idPlayer, data, true);
  });

  socket.on("player-move", (data = {}) => {
    if (!isObject(data) || !Number.isFinite(data.x) || !Number.isFinite(data.y)) {
      reportPlayerError(socket, "INVALID_POSITION", "Movement requires finite x and y coordinates.");
      return;
    }

    const player = getSocketPlayer(socket, data);
    if (!player) {
      return;
    }

    player.x = data.x;
    player.y = data.y;
    if (Number.isFinite(data.rotation)) {
      player.rotation = data.rotation;
    }
    const movement = {
      idPlayer: player.idPlayer,
      x: player.x,
      y: player.y,
      rotation: player.rotation,
    };
    socket.broadcast.emit("player-moved", movement);
  });

  socket.on("joystick-move", (data, acknowledge) => {
    const player = getSocketPlayer(socket, data);
    if (!player) {
      if (typeof acknowledge === "function") {
        acknowledge({ ok: false, message: "Player is not registered on this socket." });
      }
      return;
    }

    const movement = isObject(data) ? { ...data, idPlayer: player.idPlayer } : { idPlayer: player.idPlayer };
    socket.broadcast.emit("joystick-move", movement);
    if (typeof acknowledge === "function") {
      acknowledge({
        ok: true,
        idPlayer: player.idPlayer,
        x: movement.x,
        y: movement.y,
        otherConnectedClients: Math.max(0, io.sockets.sockets.size - 1),
      });
    }
  });

  socket.on("controller-chat", (data) => {
    console.log("controller-chat", data);
    io.emit("controller-chat", data);
  });

  socket.on("player-input", (data = {}) => {
    data = isObject(data) ? data : {};
    const player = getSocketPlayer(socket, data);
    if (!player) {
      return;
    }

    const payload = {
      interact: data.interact ?? "",
      idPlayer: player.idPlayer,
      note: data.note ?? "",
      coin: Number.isInteger(data.coin) ? data.coin : 0,
    };

    console.log("player-input", payload);
    io.emit("player-input", payload);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    const idPlayer = socket.data.idPlayer;
    if (idPlayer && players.get(idPlayer)?.socketId === socket.id) {
      players.delete(idPlayer);
      io.emit("player-left", { idPlayer });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log("Server running on http://" + HOST + ":" + PORT);
});
