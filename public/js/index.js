const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const socket = io();
const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1
canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

const x = canvas.width / 2
const y = canvas.height / 2

//foreground obj
const frontEndPlayers = {}

socket.on('updatePlayer', (backEndPlayers) => {
  //if a player doesn't exist in the foreground will be added
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]
    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({
        x: backEndPlayer.x, y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color
      })
    } else {
      //if a player erxist and still got a update event from the backend means its movement update event 
      frontEndPlayers[id].x = backEndPlayer.x
      frontEndPlayers[id].y = backEndPlayer.y
    }
  }

  //if a player exist in foreground but not in the background will be removed 
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      delete frontEndPlayers[id]
    }
  }
})


let animationId

function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  for (const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id]
    frontEndPlayer.draw()
  }

}

animate()

window.addEventListener('keydown', (e) => {
  if (!frontEndPlayers[socket.id]) return

  switch (e.code) {
    case 'KeyW':
      // frontEndPlayers[socket.id].y -= 5
      socket.emit('Keydown', 'KeyW')
      break
    case 'KeyA':
      // frontEndPlayers[socket.id].x -= 5
      socket.emit('Keydown', 'KeyA')
      break
    case 'KeyS':
      // frontEndPlayers[socket.id].y += 5
      socket.emit('Keydown', 'KeyS')
      break
    case 'KeyD':
      // frontEndPlayers[socket.id].x += 5
      socket.emit('Keydown', 'KeyD')
      break
  }
  console.log(e.code)
})