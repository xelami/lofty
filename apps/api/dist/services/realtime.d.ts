import type { WebSocket } from "ws";
type DesktopConnection = {
    userId: string;
    name: string;
    socket: WebSocket;
};
export declare function addConnection(desktopId: string, connection: DesktopConnection): void;
export declare function removeConnection(desktopId: string, connection: DesktopConnection): void;
export declare function broadcastToDesktop(desktopId: string, message: unknown, exclude?: WebSocket): void;
export declare function getDesktopConnections(desktopId: string): Set<DesktopConnection>;
export {};
//# sourceMappingURL=realtime.d.ts.map