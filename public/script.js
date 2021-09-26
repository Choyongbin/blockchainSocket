const socket = io('/')
const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})



let peers = {}

socket.on('user-connected', userId => {
    peers[userId] = userId
    //console.log(userId)
    //messageContainer.append(userId)
    connectToNewUser(userId)
})

socket.on('userId', data=> {
  console.log(data)
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].delete()
})


myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
  console.log(id)
})

function connectToNewUser(userId){
  for(values in peers){
    let conn = myPeer.connect(values)

    conn.on('open', function(){
      console.log("connect " + conn.peer)
    })

    conn.send('dddddd')

    conn.on('data', function(data){
      console.log(data)
    })

    conn.on('close', function(){
      console.log('close')
    })
  }
}


