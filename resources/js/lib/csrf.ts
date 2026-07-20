export function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    if (!match?.[1]) {
        return '';
    }

    return decodeURIComponent(match[1]);
}
