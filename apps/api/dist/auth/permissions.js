export function canReadDesktop(role) {
    return role === "owner" || role === "editor" || role === "viewer";
}
export function canEditFiles(role) {
    return role === "owner" || role === "editor";
}
export function canEditDesktop(role) {
    return role === "owner";
}
export function canManageMembers(role) {
    return role === "owner";
}
