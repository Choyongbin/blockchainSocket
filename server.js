const { json } = require("express");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));

const PORT = process.env.PORT ?? 3003;

const users = [];

app.get("/", (req, res) => {
  console.log("handle");
  // res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

const currentRoomId = "currentRoom" ?? uuidV4();
io.on("connect", (socket) => {
  socket.emit("roomId", currentRoomId);

  socket.on("join-room", (roomId, userId) => {
    console.log("on join-room", roomId, userId);
    socket.join(roomId);

    //socket broadcast는 '발신자를 제외한'
    //해당 룸에 존재하는 모든 클라이언트에게 브로드캐스트한다
    socket.broadcast.to(roomId).emit("user-connected", userId);
    socket.emit("user-list", JSON.stringify(users));
    users.push(userId);

    // socket.broadcast.to(roomId).emit("userId", JSON.stringify(users));

    console.log("users", users);

    socket.on("disconnect", () => {
      console.log(userId, "is disconnected");
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
      if (users.indexOf(userId) !== -1) {
        users.splice(users.indexOf(userId), 1);
      }
    });
  });
});

server.listen(PORT);
