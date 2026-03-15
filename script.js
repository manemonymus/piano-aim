// game state
let blackIndices = new Set()
let score = 0
let gameOver = false

// grab DOM elements
const grid = document.getElementById('grid')
const scoreEl = document.getElementById('score')

// build the 16 tiles
for (let i = 0; i < 16; i++) {
  const tile = document.createElement('div')
  tile.classList.add('tile')
  tile.dataset.index = i
  tile.addEventListener('click', () => handleClick(i))
  grid.appendChild(tile)
}

// your shuffle function from before
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function getTile(index) {
  return grid.children[index]
}

function initGame() {
  // pick 3 random black tiles
  const indices = shuffle([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
  blackIndices = new Set(indices.slice(0, 3))
  
  // reset all tiles to white first
  for (let i = 0; i < 16; i++) {
    getTile(i).className = 'tile'
  }

  // set black tiles
  blackIndices.forEach(i => getTile(i).classList.add('black'))
}

function handleClick(index) {
  if (gameOver) return

  if (blackIndices.has(index)) {
    // correct click
    getTile(index).classList.remove('black')
    blackIndices.delete(index)

    // pick a new white tile to turn black
    const whiteTiles = []
    for (let i = 0; i < 16; i++) {
      if (!blackIndices.has(i) && i!= index) whiteTiles.push(i)
    }
    const newBlack = whiteTiles[Math.floor(Math.random() * whiteTiles.length)]
    blackIndices.add(newBlack)
    getTile(newBlack).classList.add('black')

    score++
    scoreEl.textContent = `Score: ${score}`

  } else {
    // wrong click — game over
    gameOver = true
    alert(`Game Over! Score: ${score}`)
  }
}

// start the game
initGame()