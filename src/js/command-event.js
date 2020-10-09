class CommandEvent extends CustomEvent {
  constructor(command, opts = {}) {
    const defaultOpts = {
      bubbles: true,
      cancelable: false,
      composed: true,
    }
    const detail = Object.assign({ command }, opts.detail || { command })

    const option = Object.assign({}, defaultOpts, opts, { detail })
    Object.assign({}, option.detail, { command })

    super("command", option)
  }
}

export default CommandEvent
