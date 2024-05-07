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
const backEndProjectiles = {}
const RADIUS = 10
// use to track projectiles
let projectileId = 0
//fires everytime a user conncets 
io.on('connection', (socket) => {
  console.log('a user connected');
  backEndPlayers[socket.id] = {
    x: 500 * Math.random(),
    y: 500 * Math.random(),
    color: `hsl(${Math.random() * 360},100%,50%)`,
    sequenceNumber: 0,
    score: 0
  }
  // broadcast the data to ALL the connceted clients 
  io.emit('updatePlayer', backEndPlayers)

  //canvas property
  socket.on('initCanvas', ({ height, width, devicePixelRatio }) => {
    backEndPlayers[socket.id]
      .canvas = {
      height,
      width
    }
    backEndPlayers[socket.id]
      .radius = RADIUS
    if (devicePixelRatio > 1) {
      backEndPlayers[socket.id]
        .radius = RADIUS * 2
    }
  })

  //populating projectiles on backend on click event
  socket.on('shoot', ({ x, y, angle }) => {
    projectileId++

    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    backEndProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id
    }
  })

  //if this user disconnect the updated obj will be broadcasted
  socket.on('disconnect', (reason) => {
    delete backEndPlayers[socket.id]
    io.emit('updatePlayer', backEndPlayers)
  })

  //socket registers each individual clients position 
  const speed = 10
  socket.on('Keydown', ({ key, sequenceNumber }) => {
    backEndPlayers[socket.id].sequenceNumber = sequenceNumber
    switch (key) {
      case 'KeyW':
        backEndPlayers[socket.id].y -= speed
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

//every 15ms send the updated  data to ALL the client [ticker]
setInterval(() => {

  for (const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    //Garbage collection
    const projectileRadius = 5
    if (backEndProjectiles[id].x > backEndPlayers[backEndProjectiles[id].playerId]?.canvas.width + projectileRadius ||
      backEndProjectiles[id].x < -projectileRadius ||
      backEndProjectiles[id].y > backEndPlayers[backEndProjectiles[id].playerId]?.canvas.height + projectileRadius ||
      backEndProjectiles[id].y < -projectileRadius
    ) {
      delete backEndProjectiles[id]
      continue // if a projectile is removed we cant calculate collsion on that undefined object 
    }

    //collision detection 
    for (const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId]
      const distance = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x,
        backEndProjectiles[id].y - backEndPlayer.y
      )
      if (distance <= backEndPlayer.radius + 5
        && backEndProjectiles[id].playerId !== playerId) {
        //update score
        if (backEndPlayers[backEndProjectiles[id].playerId])
          backEndPlayers[backEndProjectiles[id].playerId].score++
        console.log(backEndPlayers[backEndProjectiles[id].playerId].score)

        delete backEndProjectiles[id]
        delete backEndPlayers[playerId]
        break
      }
    }
  }
  io.emit('updatePlayer', backEndPlayers)
  io.emit('updateProjectiles', backEndProjectiles)
}, 15)

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
