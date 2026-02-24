/**
 * Resolves a backend-relative image URL (e.g. /uploads/image.jpg)
 * to a full backend URL (e.g. http://localhost:5000/uploads/image.jpg).
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function getImageUrl(path: string | undefined | null): string {
    if (!path) return '';
    // If it's already a full URL (http/https), return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Resolve relative paths against the backend
    return `${BACKEND_URL}${path}`;
}
