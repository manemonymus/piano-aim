const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const scoreEl = document.getElementById('score')
const timerEl = document.getElementById('timer')
const messageEl = document.getElementById('message')
const highscoreValueEl = document.getElementById('highscore-value')

const GRID_SIZE = 4
const TILE_SIZE = 120
const BORDER = 2

canvas.width = GRID_SIZE * TILE_SIZE
canvas.height = GRID_SIZE * TILE_SIZE

let blackIndices = new Set()
let score = 0
let timeLeft = 30
let gameActive = false
let timerInterval = null

let highScore = parseInt(localStorage.getItem('highscore')) || 0
highscoreValueEl.textContent = highScore

const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

// pentatonic scale
const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]

function playPianoNote() {
  const frequency = notes[Math.floor(Math.random() * notes.length)]
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime)
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
  gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8)
  oscillator.start(audioCtx.currentTime)
  oscillator.stop(audioCtx.currentTime + 0.8)
}

function playErrorSound() {
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(100, audioCtx.currentTime)
  gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4)
  oscillator.start(audioCtx.currentTime)
  oscillator.stop(audioCtx.currentTime + 0.4)
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const col = i % GRID_SIZE
    const row = Math.floor(i / GRID_SIZE)
    const x = col * TILE_SIZE
    const y = row * TILE_SIZE
    ctx.fillStyle = blackIndices.has(i) ? 'black' : 'white'
    ctx.fillRect(x + BORDER, y + BORDER, TILE_SIZE - BORDER * 2, TILE_SIZE - BORDER * 2)
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function initGame() {
  score = 0
  timeLeft = 30
  gameActive = true
  scoreEl.textContent = '0'
  timerEl.textContent = '30.0'
  timerEl.style.color = '#f0a500'
  messageEl.textContent = ''
  const indices = shuffle([...Array(16).keys()])
  blackIndices = new Set(indices.slice(0, 3))
  drawGrid()
  clearInterval(timerInterval)
  startTimer()
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft = Math.round((timeLeft - 0.1) * 10) / 10
    timerEl.textContent = timeLeft.toFixed(1)
    if (timeLeft <= 10) timerEl.style.color = '#ff4444'
    if (timeLeft <= 0) {
      timerEl.textContent = '0.0'
      endGame()
    }
  }, 100)
}

function endGame() {
  gameActive = false
  clearInterval(timerInterval)
  if (score > highScore) {
    highScore = score
    localStorage.setItem('highscore', highScore)
    highscoreValueEl.textContent = highScore
    messageEl.textContent = 'New best! Press any key to restart'
  } else {
    messageEl.textContent = 'Press any key to restart'
  }
}

canvas.addEventListener('mousedown', (e) => {
  if (!gameActive) return
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const col = Math.floor(x / TILE_SIZE)
  const row = Math.floor(y / TILE_SIZE)
  const index = row * GRID_SIZE + col

  if (blackIndices.has(index)) {
    blackIndices.delete(index)
    const whiteTiles = []
    for (let i = 0; i < 16; i++) {
      if (!blackIndices.has(i) && i !== index) whiteTiles.push(i)
    }
    const newBlack = whiteTiles[Math.floor(Math.random() * whiteTiles.length)]
    blackIndices.add(newBlack)
    score++
    scoreEl.textContent = score
    playPianoNote(score)
    drawGrid()
  } else {
    const col = index % GRID_SIZE
    const row = Math.floor(index / GRID_SIZE)
    ctx.fillStyle = '#ff3333'
    ctx.fillRect(col * TILE_SIZE + BORDER, row * TILE_SIZE + BORDER, TILE_SIZE - BORDER * 2, TILE_SIZE - BORDER * 2)
    playErrorSound()
    endGame()
  }
})

document.addEventListener('keydown', () => {
  initGame()
})

drawGrid()