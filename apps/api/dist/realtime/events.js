import { broadcastToDesktop } from "../services/realtime.js";
export function broadcastEvent(desktopId, event, exclude) {
    broadcastToDesktop(desktopId, event, exclude);
}
