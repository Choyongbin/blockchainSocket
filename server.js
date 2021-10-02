const { json } = require('express')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

const users = []
const socketId = []

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    //console.log(userId)
    socket.join(roomId)
    socketId.push(socket.id)
    users.push(userId)

    socket.broadcast.to(roomId).emit('user-connected', userId)

    io.to(socket.id).emit('userId', JSON.stringify(users))
    //socket.broadcast.to(roomId).emit('userId', JSON.stringify(users))
    //console.log(JSON.stringify(users))

    socket.on('disconnect', () => {
      //console.log('disconnect')
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
      for(let i = 0; i<users.length; i++){
        if(users[i] === userId){
          users.splice(i,1)
          i--;
        }
      }
    })
  })
})

server.listen(3000)