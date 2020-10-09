function posOnGraph(editor, { relativeX, relativeY }) {
  return {
    x: relativeX / editor.zoom + editor.center.x,
    y: -relativeY / editor.zoom + editor.center.y,
  }
}

function relativePos({ clientX, clientY }, base) {
  const rect = base.getBoundingClientRect()
  return {
    relativeX: clientX - rect.x - rect.width / 2,
    relativeY: clientY - rect.y - rect.height / 2,
  }
}

export { posOnGraph, relativePos }
