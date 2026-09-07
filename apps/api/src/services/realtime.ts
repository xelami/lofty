import type { WebSocket } from "ws"

type DesktopConnection = {
  userId: string
  name: string
  socket: WebSocket
}

const desktopConnections = new Map<string, Set<DesktopConnection>>()

export function addConnection(
  desktopId: string,
  connection: DesktopConnection,
) {
  let connections = desktopConnections.get(desktopId)

  if (!connections) {
    connections = new Set()
    desktopConnections.set(desktopId, connections)
  }

  connections.add(connection)
}

export function removeConnection(
  desktopId: string,
  connection: DesktopConnection,
) {
  const connections = desktopConnections.get(desktopId)

  if (!connections) {
    return
  }

  connections.delete(connection)

  if (connections.size === 0) {
    desktopConnections.delete(desktopId)
  }
}

export function broadcastToDesktop(
  desktopId: string,
  message: unknown,
  exclude?: WebSocket,
) {
  const connections = desktopConnections.get(desktopId)

  if (!connections) {
    return
  }

  const payload = JSON.stringify(message)

  for (const connection of connections) {
    if (connection.socket === exclude) {
      continue
    }

    if (connection.socket.readyState === connection.socket.OPEN) {
      connection.socket.send(payload)
    }
  }
}

export function getDesktopConnections(desktopId: string) {
  return desktopConnections.get(desktopId) ?? new Set<DesktopConnection>()
}
