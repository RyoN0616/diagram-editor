class Command {
  constructor(up, down) {
    this.upProc = up
    this.downProc = down
  }

  up() {
    this.upProc()
  }

  down() {
    this.downProc()
  }
}

export default Command
