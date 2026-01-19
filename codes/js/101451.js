const fs = require('fs')
const file = fs.readFileSync('./day4.txt', 'utf-8')

const day4 = (file) => {
  // cleanup
  const lines = file.trim().split('\n\n')

  // separate out bingo call numbers
  const numbers = lines
    .shift()
    .split(',')
    .map((n) => parseInt(n))

  // separate out bingo boards
  // boards split at newline
  let boards = lines.map((x) => x.split('\n'))
  // boards split at space and int parsed
  boards = boards.map((x) => x.map((n) => n.split(' ').map((x) => parseInt(x))))
  // removing NaNs from boards where single digits had leading zeroes
  boards = boards.map((x) => x.map((n) => n.filter((n) => n || n === 0)))

  // util methods
  const findFirst = (array) =>
    array.reduce((prev, curr) =>
      prev.highestIndex < curr.highestIndex ? prev : curr
    )
  const findLast = (array) =>
    array.reduce((prev, curr) =>
      prev.highestIndex > curr.highestIndex ? prev : curr
    )
  const sum = (array) => array.reduce((a, b) => a + b, 0)

  // find winning boards and the points at which they won
  const findBingo = (numbers, board, boardnumber) => {
    const boardID = boardnumber

    const findRows = (board) => {
      const cols = board
      let rows = []
      for (let i = 0; i < board.length; i++) {
        rows.push(board[i])
      }
      return { rows, cols }
    }
    const rows = findRows(board).rows
    const cols = findRows(board).cols

    // find diagonals suggested by copilot:
    // const diag1 = board.map((x, i) => x[i])
    // const diag2 = board.map((x, i) => x[board.length - 1 - i])
    let winners = {
      boardID,
      winners: [],
      lowestIndexSum: '',
    }
    const findIndexes = (array) => array.map((x) => numbers.indexOf(x))
    for (row of rows) {
      if (row.every((x) => numbers.includes(x))) {
        const numberIndexes = findIndexes(row)
        const sumofIndexes = sum(numberIndexes)
        const highestIndex = Math.max(...numberIndexes)
        winners.winners.push({
          boardID,
          numbers: row,
          numberIndexes,
          sumofIndexes,
          highestIndex,
          type: 'row',
        })
      }
    }
    for (col of cols) {
      if (col.every((x) => numbers.includes(x))) {
        const numberIndexes = findIndexes(col)
        const sumofIndexes = sum(numberIndexes)
        const highestIndex = Math.max(...numberIndexes)
        winners.winners.push({
          boardID,
          numbers: col,
          numberIndexes,
          sumofIndexes,
          highestIndex,
          type: 'col',
        })
      }
    }
    // get first winner amongst the winning rows and cols and return it
    const first = findFirst(winners.winners)
    return first
  }

  // do the bingo search on each board
  const searchBoards = (numbers, boards) => {
    let winners = []
    for (const [index, board] of boards.entries()) {
      winners.push(findBingo(numbers, board, index))
    }
    return winners
  }

  // identifying actual winners (& losers)
  const winners = searchBoards(numbers, boards)
  const firstWinner = findFirst(winners)
  const lastWinner = findLast(winners)
  const firstWinnerBoard = boards[firstWinner.boardID]
  const lastWinnerBoard = boards[lastWinner.boardID]

  const doThePuzzleCalculation = (winner, winnerInfo) => {
    const winnerNrs = winner.flat()
    const wonAtCall = winnerInfo.highestIndex
    const numbersAtWin = numbers.slice(0, wonAtCall + 1)
    const winnerUncalledNrs = winnerNrs.filter((n) => !numbersAtWin.includes(n))
    const sumOfUncalledNrs = sum(winnerUncalledNrs)
    const winningNumber = numbers[wonAtCall]
    const factor = sumOfUncalledNrs * winningNumber
    // console.log('numbers', numbers, 'numbers called at win', numbersAtWin)
    // console.log('winning boards nrs', winnerNrs)
    // console.log('uncalled numbers', winnerUncalledNrs)
    // console.log('sum of uncalled', sumOfUncalledNrs)
    // console.log('winning nr', winningNumber)
    // console.log('factor', factor)
    return factor
  }
  const winnerfactor = doThePuzzleCalculation(firstWinnerBoard, firstWinner)
  const loserfactor = doThePuzzleCalculation(lastWinnerBoard, lastWinner)

  console.log('lastWinner', lastWinner, 'winnerfactor:', winnerfactor)
  console.log('firstWinner', firstWinner, 'loserfactor:', loserfactor)
}

day4(file)
