const socket = io('/')
//const EC = require('elliptic').ec;
//const ec = new EC('secp256k1');
//const {BlockChain, Transaction} = require('./blockchain');
const blockContainer = document.getElementById('message-container')
const blockForm = document.getElementById('send-container')
const blockInput = document.getElementById('message-input')
const blockButton = document.getElementById('send-button')


const txContainer = document.getElementById('message-container2')
const txForm = document.getElementById('send-container2')
const txInput = document.getElementById('message-input2')
const txButton = document.getElementById('send-button2')

const myPeer = new Peer(undefined, {
  host: '3.37.53.134',
  port: '3001'
})

let peers = []
let connections = []
let myId = null
// 1. 블록 전부 요청(새로운 유저가 들어 왔을 때)
// 2. pandding tx 요청(내가 pandding tx 만들어서 나머지에게 보냄)
// 3. pandding tx 가져오기 요청(새로운 유저가 들어와서 여태까지의 pandding tx 요청)
// 4. 블록 생성 요청(내가 블록 만들었을 때)
let messageType = ['request-fullblock', 'make-panddingtx', 'request-panddingtx', 'make-block']

// 새로 유저 들어온 유저 빼고 모두에게 broadcast
socket.on('user-connected', userId => {
    peers.push(userId)
})

//새로 들어온 유저에게만 보내는 통신
socket.on('userId', data=> {
  //console.log(data)
  let temp = JSON.parse(data)
  for(var i = 0; i<temp.length; i++){
    peers.push(temp[i])
  }
  if(peers.length >= 2){
    connectToNetwork()
  }
})

//유저가 빠져나갔다고 모두에게 broadcast
socket.on('user-disconnected', userId => {
  for(let i = 0; i<peers.length; i++){
    if(peers[i] === userId){
      peers.splice(i,1)
      i--;
    }
  }
})

//peer 만들기
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

//새로운 peer가 나에게 연결 요청을 보냈을 때
myPeer.on('connection', function(conn){
  console.log(conn.peer + ' connect to ' + myPeer.id)
  connections.push(conn)

  conn.on('open', function(){
    conn.on('data', function(data){
      judgeMessage(data)
      console.log(data)
    })

    conn.send(messageType[0] + ' ' + blockContainer.innerText)
    conn.send(messageType[2] + ' ' + txContainer.innerText)

    conn.on('close',function(){
      for(let i = 0; i<connections.length; i++){
        if(connections[i] === conn){
          connections.splice(i,1)
          i--;
        }
      }
    })
  })
})

myPeer.on('close', function(conn){
  console.log('disconnect')
  for(let i = 0; i<connections.length; i++){
    if(connections[i] === conn){
      connections.splice(i,1)
      i--;
    }
  }
})

myPeer.on('disconnected', function(conn){
  console.log(conn)
  for(let i = 0; i<connections.length; i++){
    if(connections[i] === conn){
      connections.splice(i,1)
      i--;
    }
  }
  myPeer.reconnect();
})

//block 만들었다고 peer들 한테 보냄
blockButton.onclick = function(){
  blockContainer.innerHTML += '<div>'+blockInput.value+'<div>'
  for(var i = 0; i<connections.length; i++){
    connections[i].send(messageType[3] + ' ' + blockInput.value) //블록이 들어가면 되는 자리
  }
  blockInput.value=''
}

//tx 만들었다고 peer들 한테 보냄
txButton.onclick = function(){
  txContainer.innerHTML += '<div>'+txInput.value+'<div>'
  for(var i = 0; i<connections.length; i++){
    connections[i].send(messageType[1] + ' ' +txInput.value)  //tx가 들어가면 되는 자리
  }
  txInput.value=''
}

//새로 들어온 peer가 다른 모두에게 연결 보내는 통신
function connectToNetwork(){
  for(var i = 0; i< peers.length -1 ; i++){
    let conn = myPeer.connect(peers[i])

    conn.on('open', function(){
      connections.push(conn)
      console.log(conn.peer + ' connect to ' + myPeer.id)

      conn.on('data', function(data){
        judgeMessage(data)
      })

      conn.on('close',function(){
        for(let i = 0; i<connections.length; i++){
          if(connections[i] === conn){
            connections.splice(i,1)
            i--;
          }
        }
      })
    })
  }
}

function judgeMessage(message){
  console.log(message)
  const str = message.toString().split(" ")
  // 1. 블록 전부 요청(새로운 유저가 들어 왔을 때)
  if(str[0] == messageType[0]){
    if(str[1] !== "" && blockContainer.innerText == ""){
      blockContainer.innerHTML += '<div>'+str[1]+'<div>'
    }
  }
  // 2. pandding tx 요청(내가 pandding tx 만들어서 나머지에게 보냄)
  else if(str[0] == messageType[1]){
    if(str[1] !== ""){
      txContainer.innerHTML += '<div>'+str[1]+'<div>'
    }
  }
  // 3. pandding tx 가져오기 요청(새로운 유저가 들어와서 여태까지의 pandding tx 요청)
  else if(str[0] == messageType[2]){
    if(str[1] !== "" && txContainer.innerText == ""){
      txContainer.innerHTML += '<div>'+str[1]+'<div>'
    }
  }
  // 4. 블록 생성 요청(내가 블록 만들었을 때)
  else if(str[0] == messageType[3]){
    if(str[1] !== ""){
      blockContainer.innerHTML += '<div>'+str[1]+'<div>'
    }
  }
  else{
    return 'error'
  }
}

