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
    color: `hsl(${Math.random() * 360},100%,50%)`
  }
  // broadcast the data to ALL the connceted clients 
  io.emit('updatePlayer', backEndPlayers)

  //if this user disconnect the updated obj will be broadcasted
  socket.on('disconnect', (reason) => {
    delete backEndPlayers[socket.id]
    io.emit('updatePlayer', backEndPlayers)
  })
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
