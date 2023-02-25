import './src/style.css'

const EMPTY = 'EMPTY'
const BOMB = 'BOMB'
const FLAG = 'FLAG'

class GameCell {
  state = ''
  showed = false
  isFlag = false
  bobmPercentage
  constructor(bobmPercentage = 0.5) {
    this.bobmPercentage = bobmPercentage + 1
    this.state = this.getRandomState()
  }
  makeVisible() {
    this.showed = true
  }
  toggleFlag() {
    this.isFlag = !this.isFlag
  }
  getRandomState() {
    const random = Math.ceil(Math.random() * this.bobmPercentage)
    switch (random) {
      case 1:
        return EMPTY
      default:
        return BOMB
    }
  }
}
class Game {
  htmlElem
  gridSize
  gameArray
  bobmPercentage = 0.2
  firstClick = true
  isGameOver = false
  touchTimeout = null
  lastChange = { x: null, y: null }
  touch = { lastX: null, lastY: null }

  constructor(selector = '.game', gridSize = 15) {
    this.htmlElem = document.querySelector(selector)
    this.gridSize = gridSize
    this.htmlElem.style.setProperty('--cels', gridSize)
  }

  init() {
    this.createArray()
    this.renderArray()
    this.setEvents()
  }

  restart() {
    this.htmlElem.style.setProperty('--cels', this.gridSize)
    this.firstClick = true
    this.isGameOver = false
    this.createArray()
    this.renderArray()
  }

  getCell(x, y) {
    if (x < 0 || x > this.gridSize - 1 || y < 0 || y > this.gridSize - 1)
      return { state: null }
    return this.gameArray[x][y]
  }

  countBombsAround(x, y) {
    let counter = 0
    if (this.getCell(x - 1, y - 1).state === BOMB) counter++
    if (this.getCell(x, y - 1).state === BOMB) counter++
    if (this.getCell(x + 1, y - 1).state === BOMB) counter++
    if (this.getCell(x + 1, y).state === BOMB) counter++
    if (this.getCell(x + 1, y + 1).state === BOMB) counter++
    if (this.getCell(x, y + 1).state === BOMB) counter++
    if (this.getCell(x - 1, y + 1).state === BOMB) counter++
    if (this.getCell(x - 1, y).state === BOMB) counter++
    return counter
  }

  renderArray() {
    let newHTML = ''

    this.gameArray.forEach((row, x) => {
      row.forEach((cell, y) => {
        let baseType = EMPTY

        if (cell.state === EMPTY) {
          if (cell.showed === true) {
            baseType = 'num cell-num-' + this.countBombsAround(x, y)
          } else {
            baseType = EMPTY
          }
        } else if (cell.state === BOMB) {
          if (this.isGameOver) baseType = BOMB
        }
        if (cell.isFlag && cell.showed === false) {
          baseType = FLAG
          if (cell.state === BOMB && this.isGameOver) baseType = BOMB
        }

        const animate =
          this.lastChange.x === x && this.lastChange.y === y ? 'animate' : ''
        newHTML += `
        <div class="cell 
          ${cell.showed ? 'cell-SHOWED' : ''} 
          cell-${baseType} 
          ${animate}" 
          data-x="${x}" data-y="${y}"
        ></div>`
      })
    })

    this.htmlElem.innerHTML = newHTML
  }

  createArray() {
    const gameArray = []

    for (let i = 0; i < this.gridSize; i++) {
      const row = []
      for (let j = 0; j < this.gridSize; j++) {
        row.push(new GameCell(this.bobmPercentage))
      }
      gameArray.push(row)
    }

    this.gameArray = gameArray
  }

  emptyClick(cell, x, y) {
    cell.showed = true

    if (this.countBombsAround(x, y) === 0) {
      const checkSide = (x, y) => {
        if (x < 0 || x > this.gridSize - 1 || y < 0 || y > this.gridSize - 1)
          return
        if (this.countBombsAround(x + 1, y) === 0) {
          if (!this.getCell(x + 1, y).showed) {
            this.getCell(x + 1, y).showed = true
            checkSide(x + 1, y)
          }
        }
        if (this.countBombsAround(x - 1, y) === 0) {
          if (!this.getCell(x - 1, y).showed) {
            this.getCell(x - 1, y).showed = true
            checkSide(x - 1, y)
          }
        }
        if (this.countBombsAround(x, y + 1) === 0) {
          if (!this.getCell(x, y + 1).showed) {
            this.getCell(x, y + 1).showed = true
            checkSide(x, y + 1)
          }
        }
        if (this.countBombsAround(x, y - 1) === 0) {
          if (!this.getCell(x, y - 1).showed) {
            this.getCell(x, y - 1).showed = true
            checkSide(x, y - 1)
          }
        }
        this.getCell(x + 1, y).showed = true
        this.getCell(x - 1, y).showed = true
        this.getCell(x, y + 1).showed = true
        this.getCell(x, y - 1).showed = true
        this.getCell(x + 1, y).isFlag = false
        this.getCell(x - 1, y).isFlag = false
        this.getCell(x, y + 1).isFlag = false
        this.getCell(x, y - 1).isFlag = false
      }

      checkSide(x, y)
    }
  }

  cellClick(x, y) {
    const cell = this.getCell(x, y)

    if (this.firstClick) {
      this.firstClick = false
      cell.state = EMPTY
      this.getCell(x - 1, y - 1).state = EMPTY
      this.getCell(x + 1, y - 1).state = EMPTY
      this.getCell(x + 1, y + 1).state = EMPTY
      this.getCell(x - 1, y + 1).state = EMPTY
      this.getCell(x, y - 1).state = EMPTY
      this.getCell(x + 1, y).state = EMPTY
      this.getCell(x, y + 1).state = EMPTY
      this.getCell(x - 1, y).state = EMPTY
    }

    if (cell.state === EMPTY) {
      this.emptyClick(cell, x, y)
    }
    if (cell.state === BOMB) {
      this.isGameOver = true
      // game over/restart logic
    }
    this.renderArray()
  }

  toggleFlag(x, y) {
    const cell = this.getCell(x, y)
    if (cell.isShowed) return
    cell.isFlag = !cell.isFlag
    this.renderArray()
  }


  clickHandler(e, trusted = false) {
    const target = e.target
    const cell = target.closest('.cell')
    const btnRestart = target.closest('.btn-restart')
    const btnSize = target.closest('.btn-size')
    if (cell) {
      if (!trusted && ('ontouchstart' in window || navigator.maxTouchPoints))
        return
      const { x, y } = cell.dataset
      this.lastChange.x = +x
      this.lastChange.y = +y
      this.cellClick(+x, +y)
    }
    if (btnRestart) {
      this.restart()
    }
    if (btnSize) {
      this.gridSize = +btnSize.dataset.size
      this.restart()
    }
  }
  rightClickHandler(e) {
    e.preventDefault()
    const target = e.target
    const cell = target.closest('.cell')
    if (cell) {
      const { x, y } = cell.dataset
      this.lastChange.x = +x
      this.lastChange.y = +y
      this.toggleFlag(+x, +y)
    }
  }
  touchHandler(e) {
    this.touch.lastX = e.touches[0].clientX
    this.touch.lastY = e.touches[0].clientY
    if (e.touches.length > 1) return
    this.touchTimeout = setTimeout(() => {
      clearTimeout(this.touchTimeout)
      this.touchTimeout = null
      this.rightClickHandler(e)
    }, 200)
  }
  touchEndHandler(e) {
    if (this.touchTimeout) {
      clearTimeout(this.touchTimeout)
      this.touchTimeout = null
      this.clickHandler(e, true)
      return
    }
    this.touchTimeout = null
  }
  touchMoveHandler(e) {
    const deltaX = Math.abs(this.touch.lastX - e.touches[0].clientX)
    const deltaY = Math.abs(this.touch.lastY - e.touches[0].clientY)
    if (deltaX + deltaY > 3 || e.touches.length > 1) {
      clearTimeout(this.touchTimeout)
      this.touchTimeout = null
    }
  }

  setEvents() {
    document.addEventListener('click', this.clickHandler.bind(this))
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
      document.addEventListener('touchstart', this.touchHandler.bind(this))
      document.addEventListener('touchend', this.touchEndHandler.bind(this))
      document.addEventListener('touchmove', this.touchMoveHandler.bind(this))
    } else {
      this.htmlElem.addEventListener(
        'contextmenu',
        this.rightClickHandler.bind(this)
      )
    }
  }
}

new Game().init()

// TODO
/*
  timer, flags back count, game setting menu, game over
*/

