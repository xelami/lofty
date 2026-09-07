const desktopConnections = new Map();
export function addConnection(desktopId, connection) {
    let connections = desktopConnections.get(desktopId);
    if (!connections) {
        connections = new Set();
        desktopConnections.set(desktopId, connections);
    }
    connections.add(connection);
}
export function removeConnection(desktopId, connection) {
    const connections = desktopConnections.get(desktopId);
    if (!connections) {
        return;
    }
    connections.delete(connection);
    if (connections.size === 0) {
        desktopConnections.delete(desktopId);
    }
}
export function broadcastToDesktop(desktopId, message, exclude) {
    const connections = desktopConnections.get(desktopId);
    if (!connections) {
        return;
    }
    const payload = JSON.stringify(message);
    for (const connection of connections) {
        if (connection.socket === exclude) {
            continue;
        }
        if (connection.socket.readyState === connection.socket.OPEN) {
            connection.socket.send(payload);
        }
    }
}
export function getDesktopConnections(desktopId) {
    return desktopConnections.get(desktopId) ?? new Set();
}
