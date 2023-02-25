import './src/style.css'

const EMPTY = 'EMPTY'
const BOMB = 'BOMB'
const FLAG = 'FLAG'


class InformationButton {
  text
  className
  isHidden
  html
  constructor({ text='', className='', isHidden=false }) {
    this.text = text
    this.className = className
    this.isHidden = isHidden
    this.addToDocument()
  }
  layout() {
    const element = document.createElement('div')
    element.innerHTML = this.text
    element.classList = `main-btn ${ this.className }`
    if (this.isHidden) {
      element.style.display = 'none'
      element.style.opacity = '0'
    }
    return element
  }
  addToDocument() {
    this.html = this.layout()
    document.body.append(this.html)
  }
  hide() {
    this.html.style.opacity = 0
    setTimeout(() => {
      this.html.style.display = 'none'
    }, 400)
    this.isHidden = true
  }
  show() {
    this.html.style.display = 'flex'
    setTimeout(() => {
      this.html.style.opacity = 1
    }, 0)
    this.isHidden = false
  }
}
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

class Controls {
  touch = { lastX: null, lastY: null, timeout: null }
  game = null
  constructor(game) {
    this.game = game
    this.setEvents()
  }

  clickHandler(e, trusted = false) {
    const target = e.target
    const cell = target.closest('.cell')
    const btnRestart = target.closest('.btn-restart')
    const btnSize = target.closest('.btn-size')
    const btnStart = target.closest('.start-btn')
    const gameOver = target.closest('.game-over')
    const win = target.closest('.win')
    if (cell) {
      if (!trusted && ('ontouchstart' in window || navigator.maxTouchPoints))
        return
      const { x, y } = cell.dataset
      this.game.cellClick(+x, +y)
    }
    if (btnRestart || gameOver || win) {
      this.game.restart()
      return
    }
    if (btnSize) {
      this.game.changeGridSize(+btnSize.dataset.size)
      return
    }
    if (btnStart) {
      this.game.startGame()
      return
    }
  }
  rightClickHandler(e) {
    e.preventDefault()
    const target = e.target
    const cell = target.closest('.cell')
    if (cell) {
      const { x, y } = cell.dataset
      this.game.toggleFlag(+x, +y)
    }
  }
  touchHandler(e) {
    this.touch.lastX = e.touches[0].clientX
    this.touch.lastY = e.touches[0].clientY
    if (e.touches.length > 1) return
    this.touch.timeout = setTimeout(() => {
      clearTimeout(this.touch.timeout)
      this.touch.timeout = null
      this.rightClickHandler(e)
    }, 200)
  }
  touchEndHandler(e) {
    if (this.touch.timeout) {
      clearTimeout(this.touch.timeout)
      this.touch.timeout = null
      this.clickHandler(e, true)
      return
    }
    this.touch.timeout = null
  }
  touchMoveHandler(e) {
    const deltaX = Math.abs(this.touch.lastX - e.touches[0].clientX)
    const deltaY = Math.abs(this.touch.lastY - e.touches[0].clientY)
    if (deltaX + deltaY > 3 || e.touches.length > 1) {
      clearTimeout(this.touch.timeout)
      this.touch.timeout = null
    }
  }

  setEvents() {
    document.addEventListener('click', this.clickHandler.bind(this))
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
      document.addEventListener('touchstart', this.touchHandler.bind(this))
      document.addEventListener('touchend', this.touchEndHandler.bind(this))
      document.addEventListener('touchmove', this.touchMoveHandler.bind(this))
    } else {
      this.game.htmlElem.addEventListener(
        'contextmenu',
        this.rightClickHandler.bind(this)
      )
    }
  }

}
class Game {
  htmlElem
  startBtn
  gridSize
  gameArray
  controls
  bobmPercentage = 0.2
  firstClick = true
  isGameOver = false
  lastChange = { x: null, y: null }
  layout = {}

  constructor(selector = '.game', startBtn = '.start-btn', gridSize = 15) {
    this.htmlElem = document.querySelector(selector)
    this.startBtn = document.querySelector(startBtn)
    this.gridSize = gridSize
    this.htmlElem.style.setProperty('--cels', gridSize)
  }

  init() {
    this.createArray()
    this.controls = new Controls(this)
    this.makeLayout()
  }

  makeLayout() {
    this.layout.btnStart = new InformationButton({ text: 'start', className: 'start-btn' })
    this.layout.btnGameOver = new InformationButton({ text: 'game over', className: 'game-over', isHidden: true })
    this.layout.btnWin = new InformationButton({ text: 'solved!', className: 'win', isHidden: true })
  }

  restart() {
    this.layout.btnGameOver.hide()
    this.layout.btnWin.hide()
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
    let isWin = true
    this.gameArray.forEach((row, x) => {
      row.forEach((cell, y) => {
        if (cell.state === BOMB && !cell.isFlag || cell.state === EMPTY && cell.isFlag) isWin = false

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

        const cellShowed = cell.showed ? 'cell-SHOWED' : ''
        const animate = this.lastChange.x === x && this.lastChange.y === y ? 'animate' : ''
        newHTML += `<div class="cell ${cellShowed} cell-${baseType} ${animate}" data-x="${x}" data-y="${y}"></div>`
      })
    })

    this.htmlElem.innerHTML = newHTML

    if (isWin) {
      this.isGameOver = true
      this.layout.btnWin.show()
    }
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
    if (this.isGameOver) return
    this.lastChange.x = +x
    this.lastChange.y = +y

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
      this.layout.btnGameOver.show()
    }
    this.renderArray()
  }

  toggleFlag(x, y) {
    if (this.isGameOver) return
    this.lastChange.x = +x
    this.lastChange.y = +y
    
    const cell = this.getCell(x, y)
    if (cell.isShowed) return
    cell.isFlag = !cell.isFlag
    this.renderArray()
  }

  changeGridSize(size) {
    this.gridSize = size
    this.restart()
  }

  startGame() {
    this.renderArray()
    this.htmlElem.style.opacity = 1
    this.layout.btnStart.hide()
  }
}

new Game().init()

// TODO
/*
  timer, flags back count, game setting menu, game over
*/

