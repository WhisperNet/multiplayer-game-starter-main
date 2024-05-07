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
const frontEndProjectiles = {}

socket.on('connect', () => {
  socket.emit('initCanvas', { width: canvas.width, height: canvas.height, devicePixelRatio })
})

socket.on('updateProjectiles', backEndProjectiles => {
  for (const id in backEndProjectiles) {
    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] =
        new Projectile({ x: backEndProjectiles[id].x, y: backEndProjectiles[id].y, radius: 5, color: frontEndPlayers[backEndProjectiles[id].playerId]?.color, velocity: backEndProjectiles[id].velocity })
    } else {
      frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x
      frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y
    }
  }
  // remove the projectile from frontend if it does not exist in the background 
  for (const id in frontEndProjectiles) {
    if (!backEndProjectiles[id]) {
      delete frontEndProjectiles[id]
    }
  }
})

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
      document.querySelector("#playerLabels").innerHTML +=
        `<div data-id="${id}" data-score="${backEndPlayer.score}"> 
      ${id}: ${backEndPlayer.score}
      </div>`
    } else {
      //updating score
      document.querySelector(`div[data-id="${id}"]`).innerHTML = `${id}: ${backEndPlayer.score}`
      document.querySelector(`div[data-id="${id}"]`).setAttribute("data-score", backEndPlayer.score)

      //sorting score
      const pernDiv = document.querySelector("#playerLabels")
      const chlidDivs = Array.from(pernDiv.querySelectorAll('div'))

      chlidDivs.sort((a, b) => (Number(b.getAttribute('data-score'))) - Number(a.getAttribute('data-score')))
      //remove old elms
      chlidDivs.forEach(div => {
        pernDiv.removeChild(div)
      })
      // add sorted elms
      chlidDivs.forEach(div => {
        pernDiv.appendChild(div)
      })

      //if a player erxist and still got a update event from the backend means its movement update event 
      gsap.to(frontEndPlayers[id], {      //gsap for opponent interpolation
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        duration: 0.015,
        ease: 'linear'
      })

      //server reconciliation for the player {Not opponent movement}
      if (id === socket.id) {
        const lastBackendInputIndex = playerInputs.findIndex(input => backEndPlayer.sequenceNumber === input.sequenceNumber)
        if (lastBackendInputIndex > -1) playerInputs.splice(0, lastBackendInputIndex + 1)

        playerInputs.forEach(input => {
          frontEndPlayers[id].x += input.dx
          frontEndPlayers[id].y = input.dy
        })
      }
    }
  }

  //if a player exist in foreground but not in the background will be removed 
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      document.querySelector(`div[data-id="${id}"]`).remove()
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
  for (const id in frontEndProjectiles) {
    frontEndProjectiles[id].draw()
  }

}

animate()

const speed = 10
const playerInputs = []
let sequenceNumber = 0
const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

//movemnet prediction and emitting 

setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: -speed })
    frontEndPlayers[socket.id].y -= speed
    socket.emit('Keydown', { key: 'KeyW', sequenceNumber })
  }
  if (keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: -speed, dy: 0 })
    frontEndPlayers[socket.id].x -= speed
    socket.emit('Keydown', { key: 'KeyA', sequenceNumber })
  }
  if (keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: speed })
    frontEndPlayers[socket.id].y += speed
    socket.emit('Keydown', { key: 'KeyS', sequenceNumber })
  }
  if (keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: speed, dy: 0 })
    frontEndPlayers[socket.id].x += speed
    socket.emit('Keydown', { key: 'KeyD', sequenceNumber })
  }
}, 15);

window.addEventListener('keydown', (e) => {
  if (!frontEndPlayers[socket.id]) return

  switch (e.code) {
    case 'KeyW':
      keys.w.pressed = true
      break
    case 'KeyA':
      keys.a.pressed = true
      break
    case 'KeyS':
      keys.s.pressed = true
      break
    case 'KeyD':
      keys.d.pressed = true
      break
  }
})

window.addEventListener('keyup', (e) => {
  if (!frontEndPlayers[socket.id]) return

  switch (e.code) {
    case 'KeyW':
      keys.w.pressed = false
      break
    case 'KeyA':
      keys.a.pressed = false
      break
    case 'KeyS':
      keys.s.pressed = false
      break
    case 'KeyD':
      keys.d.pressed = false
      break
  }
})