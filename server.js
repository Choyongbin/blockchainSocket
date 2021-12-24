
const express = require("express");
const app = express();

const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const { v4: uuidV4, v1: uuidV1 } = require("uuid");
const fs = require('fs')
const PORT = process.env.NODE_ENV === "development" ? 3003 : 3013;
const crypto = require('crypto')
const users = [];

app.set("view engine", "ejs");
app.use(express.static("public"));
app.get("/", (req, res) => {
  console.log("handle");
  res.status(200).json({ message: "hi" }).end();
});

// app.get("/:room", (req, res) => {
//   res.render("room", { roomId: req.params.room });
// });

//-------------------------------------------------------------------------------------------------

const potentialbuffer = fs.readFileSync('./GiChul_backup/gichulgenerator-potential-export.json')
const answerbuffer = fs.readFileSync('./GiChul_backup/gichulgenerator-answer-export.json')
const potentialJSON = JSON.parse(potentialbuffer)
const answerJSON = JSON.parse(answerbuffer)

const randomNormal = (function sourceRandomNormal(source) {
  function randomNormal(mu, sigma) {
    var x, r;
    mu = mu == null ? 0 : +mu;
    sigma = sigma == null ? 1 : +sigma;
    
    return function() {
      var y;
      if (x != null) (y = x), (x = null);
      else
        do {
	  x = source() * 2 - 1;
	  y = source() * 2 - 1;
	  r = x * x + y * y;
	}while(!r || r > 1);
      return mu + sigma * y * Math.sqrt((-1 * Math.log(r)) / r);
    };
  }
  randomNormal.source = Math.random;
  return randomNormal;
})(Math.random);


function random_item(items){
  return items[Math.floor(Math.random()*items.length)];
}

let ran0 = random_item(Object.keys(potentialJSON))
let ran1 = random_item(Object.keys(potentialJSON[ran0]))
let ran2 = random_item(Object.keys(potentialJSON[ran0][ran1]))
let ran3 = random_item(Object.keys(potentialJSON[ran0][ran1][ran2]))

let buf = potentialJSON[ran0][ran1][ran2][ran3]
let hardness = 1
let sigma = 10
buf = buf.slice(22,31)

function closestRandom(buf){
  let goal = Math.floor(randomNormal(100 - hardness, sigma)())
  const closest = buf.reduce((prev, curr) => {
    return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr: prev);
  });
  return buf.indexOf(closest) + 22
}

let pickindex = closestRandom(buf)


let imgpath = "./problem/"+ran0+"_"+ran2+"_"+ran1+"_"+ran3+"/q_"+ran0+"_"+ran2+"_"+ran1+"_"+ran3+"_"+pickindex+".png"
//console.log("path : ", imgpath)
let answer = answerJSON[ran0][ran1][ran2][ran3][pickindex]
//console.log("answer : ", answer)

function changeHardness(num){
  hardness = Math.atan(num)
}

//-----------------------------------------------------------------------------
let beforeProblem_id = "";
let beforeHash = "";
let currentProblem_id = "";
let currentHash = "";
let contents = "";
let userAnswerSocket = []

//현재 문재에 대한 정답자 수
let rightCounts= 0;

const currentRoomId = "currentRoom" ?? uuidV4();
io.on("connect", (socket) => {
  socket.emit("roomId", currentRoomId);

  socket.on("join-room", (roomId, userId) => {
    console.log("on join-room", roomId, userId);
    socket.join(roomId);

    socket.broadcast.to(roomId).emit("user-connected", userId);
    socket.emit("user-list", {users, beforeHash});
    
    socket.emit("NEW_PROBLEM", contents);

    users.push(userId);
    changeHardness(users.length)

    console.log("users", users);

    socket.on("disconnect", () => {
      console.log(userId, "is disconnected");
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
      if (users.indexOf(userId) !== -1) {
        users.splice(users.indexOf(userId), 1);
        changeHardness(users.length)
      }
    });
  });

    
  socket.on('ANSWER', clientAnswer=>{
    if(!userAnswerSocket.find(v => v == socket.id)){
      let msg = currentProblem_id + clientAnswer
      let tmp = crypto.createHash('sha256').update(msg).digest('base64')
     
      socket.emit("USER_HASH", tmp)
      userAnswerSocket.push(socket.id)

      if(tmp === currentHash){
        rightCounts++;
      }
    }
  })  
});

let count = 0
  
setInterval(()=>{
  if(count > 0){
    io.emit('REAL_HASH', currentHash)
  }
  userAnswerSocket = []
  ran0 = random_item(Object.keys(potentialJSON))
  ran1 = random_item(Object.keys(potentialJSON[ran0]))
  ran2 = random_item(Object.keys(potentialJSON[ran0][ran1]))
  ran3 = random_item(Object.keys(potentialJSON[ran0][ran1][ran2]))
     
  buf = potentialJSON[ran0][ran1][ran2][ran3]
  buf = buf.slice(22,31)
  pickindex = closestRandom(buf)
  imgpath = "./GiChul_backup/"+ran0+"_"+ran2+"_"+ran1+"_"+ran3+"/q_"+ran0+"_"+ran2+"_"+ran1+"_"+ran3+"_"+pickindex+".png";
  console.log(imgpath)

  answer = answerJSON[ran0][ran1][ran2][ran3][pickindex]
  answer = 1
  contents = fs.readFileSync(imgpath, {encoding: 'base64'})
 
  if(rightCounts>= 1){
    beforeProblem_id = currentProblem_id;
    beforeHash = currentHash;
    rightCounts= 0;
  }
  console.log('beforeHash : '+ beforeHash);
  currentProblem_id = imgpath + uuidV1();
  currentHash = crypto.createHash('sha256').update(currentProblem_id + answer).digest('base64')

  //console.log("beforeProblemId : " + beforeProblem_Id)
  //console.log("beforeHash : " + beforeHash)
  io.emit('NEW_PROBLEM', contents)
  count++
}, 1000 * 60);


const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  proxied: true,
});
peerServer.on("connection", () => console.log("peerServer is conencted"));
app.use("/peerjs", peerServer);

const cors = require("cors");
app.use(cors());

server.listen(PORT);
