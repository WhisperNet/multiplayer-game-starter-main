const express = require('express')
const app = express()

//socket.io setup
// socket.io needs http server to work
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
/* sends ping to the foreground every 2sec if no response in 5s the client
will be removed and disconnect event will be called. handles the edge case where
high load causes the server to miss calling the disconnect event*/
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })
const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

//this will keep all the player states
const backEndPlayers = {}

//fires everytime a user conncets 
io.on('connection', (socket) => {
  console.log('a user connected');
  backEndPlayers[socket.id] = {
    x: 500 * Math.random(),
    y: 500 * Math.random(),
    color: `hsl(${Math.random() * 360},100%,50%)`,
    sequenceNumber: 0
  }
  // broadcast the data to ALL the connceted clients 
  io.emit('updatePlayer', backEndPlayers)

  //if this user disconnect the updated obj will be broadcasted
  socket.on('disconnect', (reason) => {
    delete backEndPlayers[socket.id]
    io.emit('updatePlayer', backEndPlayers)
  })

  //socket registers each individual clients position 
  const speed = 10
  socket.on('Keydown', ({ key, sequenceNumber }) => {
    console.log(key)
    backEndPlayers[socket.id].sequenceNumber = sequenceNumber
    switch (key) {
      case 'KeyW':
        backEndPlayers[socket.id].y -= speed
        console.log(key)
        break
      case 'KeyA':
        backEndPlayers[socket.id].x -= speed
        break
      case 'KeyS':
        backEndPlayers[socket.id].y += speed
        break
      case 'KeyD':
        backEndPlayers[socket.id].x += speed
        break
    }
  })
});

//every 15ms send the updated movement data to ALL the client 
setInterval(() => {
  io.emit('updatePlayer', backEndPlayers)
}, 15)

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
