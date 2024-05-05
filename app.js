const express = require('express')
const app = express()

//socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })
const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

//this will keep all the player states
const players = {}

//fires everytime a user conncets 
io.on('connection', (socket) => {
  console.log('a user connected');
  players[socket.id] = {
    x: 500 * Math.random(),
    y: 500 * Math.random()
  }
  // broadcast the data to ALL the connceted clients 
  io.emit('updatePlayer', players)

  socket.on('disconnect', (reason) => {
    delete players[socket.id]
    io.emit('updatePlayer', players)
  })
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
