const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const socket = io();
const scoreEl = document.querySelector('#scoreEl')

canvas.width = innerWidth
canvas.height = innerHeight

const x = canvas.width / 2
const y = canvas.height / 2

const player = new Player(x, y, 10, 'white')
//foreground obj
const players = {}

socket.on('updatePlayer', (backEndPlayers) => {
  //if a player doesn't exist in the foreground will be added
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]
    if (!players[id]) {
      players[id] = new Player(backEndPlayer.x, backEndPlayer.y, 10, 'red')
    }
  }
  //if a player exist in foreground but not in the background will be removed 
  for (const id in players) {
    if (!backEndPlayers[id]) {
      delete players[id]
    }
  }
})


let animationId

function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  for (const id in players) {
    const player = players[id]
    player.draw()
  }

}

animate()

