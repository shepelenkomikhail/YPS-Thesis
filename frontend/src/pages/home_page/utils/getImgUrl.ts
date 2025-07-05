export const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    return url.startsWith('http') ? url : `http://localhost:8000${url}`;
};