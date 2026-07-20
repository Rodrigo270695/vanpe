export function isBraveBrowser(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return 'brave' in navigator;
}

export function isLikelyBravePushBlocked(): boolean {
    return isBraveBrowser() && window.isSecureContext && location.protocol === 'http:';
}
