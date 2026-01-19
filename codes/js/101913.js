class GameBoard {
  constructor(width = 10) {
    this.shipTypes = [
      { name: "Carrier", length: 5, position: "horizontal" },
      { name: "Battleship", length: 4, position: "horizontal" },
      { name: "Cruiser", length: 3, position: "horizontal" },
      { name: "Submarine", length: 3, position: "horizontal" },
      { name: "Destroyer", length: 2, position: "horizontal" },
    ];
    this.board = this.create(width);
    this.ships = [];
    this.latestHit = null;
  }

  create(width) {
    let board = [];

    for (let i = 0; i < width; ++i) {
      const row = [];
      for (let j = 0; j < width; ++j) {
        row.push(null);
      }
      board.push(row);
    }

    return board;
  }

  reset() {
    this.board = this.create(this.board.length);
    this.ships = [];
    this.latestHit = null;
  }

  mark(coordinates, shipType) {
    for (let i = 0; i < coordinates.length; ++i) {
      const [x, y] = coordinates[i];
      this.board[x][y] = shipType;
    }
  }

  calculateCoordinates(startingCoordinates, shipPosition, shipLength) {
    const [x, y] = startingCoordinates;
    const coordinates = [];

    for (let i = 0; i < shipLength; ++i) {
      if (shipPosition === "vertical") {
        coordinates.push([x + i, y]);
      } else {
        coordinates.push([x, y + i]);
      }
    }

    return coordinates;
  }

  createShipCoordinates(type, startingCoordinates, position) {
    const shipLength = this.shipTypes.find((ship) => ship.name === type).length;

    const shipCoordinates = this.calculateCoordinates(
      startingCoordinates,
      position,
      shipLength
    );

    return shipCoordinates;
  }

  checkIfShipCoordinatesAreInBounds(coordinates) {
    for (let i = 0; i < coordinates.length; ++i) {
      const [x, y] = coordinates[i];
      if (x < 0 || x >= this.board.length || y < 0 || y >= this.board.length) {
        return false;
      }
    }
    return true;
  }

  checkIfGameBoardCellIsTaken(coordinates, type = null) {
    for (let i = 0; i < coordinates.length; ++i) {
      const [x, y] = coordinates[i];
      if (this.board[x][y] && this.board[x][y] !== type) {
        return false;
      }
    }
    return true;
  }

  // Created with ChatGPT-4o
  checkIfShipIsWithinOneCellFromAnotherShip(coordinates) {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];

    return coordinates.some(([x, y]) =>
      directions.some(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return (
          nx >= 0 &&
          nx < this.board.length &&
          ny >= 0 &&
          ny < this.board.length &&
          this.board[nx][ny]
        );
      })
    );
  }

  placeShipRandomly(type, startingCoordinates, position = "horizontal") {
    const shipCoordinates = this.createShipCoordinates(
      type,
      startingCoordinates,
      position
    );

    if (
      !this.checkIfShipCoordinatesAreInBounds(shipCoordinates) ||
      !this.checkIfGameBoardCellIsTaken(shipCoordinates) ||
      this.checkIfShipIsWithinOneCellFromAnotherShip(shipCoordinates)
    ) {
      return false;
    }

    this.mark(shipCoordinates, type);
    this.ships.push({
      name: type,
      coordinates: shipCoordinates,
      position: position,
      length: this.shipTypes.find((ship) => ship.name === type).length,
      isSunk: false,
    });
    return true;
  }

  placeShipsRandomly() {
    const shipTypes = this.shipTypes.map((ship) => ship.name);
    for (let i = 0; i < shipTypes.length; ++i) {
      while (true) {
        const x = Math.floor(Math.random() * this.board.length);
        const y = Math.floor(Math.random() * this.board.length);
        const position = Math.random() < 0.5 ? "horizontal" : "vertical";

        if (this.placeShipRandomly(shipTypes[i], [x, y], position)) {
          break;
        }
      }
    }
  }

  placeShipManually(type, startingCoordinates, position = "horizontal") {
    const shipCoordinates = this.createShipCoordinates(
      type,
      startingCoordinates,
      position
    );

    if (
      !this.checkIfShipCoordinatesAreInBounds(shipCoordinates) ||
      !this.checkIfGameBoardCellIsTaken(shipCoordinates, type)
    ) {
      return false;
    }

    if (this.ships.find((ship) => ship.name === type)) {
      this.ships = this.ships.map((ship) =>
        ship.name === type
          ? { ...ship, coordinates: shipCoordinates, position: position }
          : ship
      );
    } else {
      this.ships.push({
        name: type,
        coordinates: shipCoordinates,
        position: position,
        length: this.shipTypes.find((ship) => ship.name === type).length,
        isSunk: false,
      });
    }
    this.updateShipPositions();
    return true;
  }

  updateShipPositions() {
    this.board = this.create(this.board.length);
    this.ships.forEach((ship) => {
      this.mark(ship.coordinates, ship.name);
    });
  }

  checkIfShipIsSunk(shipName) {
    for (let i = 0; i < this.board.length; ++i) {
      for (let j = 0; j < this.board.length; ++j) {
        if (this.board[i][j] === shipName) {
          return false;
        }
      }
    }
    return true;
  }

  receiveAttack(coordinates) {
    const [x, y] = coordinates;
    if (this.board[x][y] == "hit" || this.board[x][y] == "miss") {
      return false;
    }
    const checkIfShipIsHit = this.shipTypes.find(
      (ship) => ship.name === this.board[x][y]
    );

    if (checkIfShipIsHit) {
      const findShipThatIsHit = this.ships.find(
        (ship) => ship.name === this.board[x][y]
      );
      this.board[x][y] = "hit";
      if (this.checkIfShipIsSunk(findShipThatIsHit.name)) {
        this.ships = this.ships.map((ship) =>
          ship.name === findShipThatIsHit.name
            ? { ...ship, isSunk: true }
            : ship
        );
      }
    } else {
      this.board[x][y] = "miss";
    }
    this.latestHit = coordinates;
    return true;
  }

  allShipsSunk() {
    for (let i = 0; i < this.board.length; ++i) {
      for (let j = 0; j < this.board.length; ++j) {
        if (this.shipTypes.find((ship) => ship.name === this.board[i][j])) {
          return false;
        }
      }
    }
    return true;
  }
}

export default GameBoard;
