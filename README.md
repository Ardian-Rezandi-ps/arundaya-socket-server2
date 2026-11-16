# arundaya-socket-server2

## Multiplayer player control

Each browser connection should join once with the unique ID of the character it
controls. The server associates that ID with the connection, so another
connection cannot control the same character while it is online.

```js
socket.emit("player-join", { idPlayer: "player-1", x: 0, y: 0 });

socket.on("players-list", (players) => {
  // Initialize the game with all currently connected players.
});

socket.emit("player-move", { x: 12, y: 8, rotation: 90 });
socket.on("player-moved", (movement) => {
  // Update the character identified by movement.idPlayer.
});
```

`player-join` receives `players-list` with `{ idPlayer, x, y, rotation }`
entries. Other connections receive `player-joined`, `player-moved`, and
`player-left` events. Movement requires finite `x` and `y` values; `rotation`
is optional. `joystick-move` and `player-input` remain supported, but require a
joined player (or an `idPlayer` on the first event) and are tagged with the
connection's assigned ID. Invalid or duplicate IDs are reported through
`player-error`.

