# Deployment Plan: NearbyStores

This plan outlines how to deploy the full-stack application.

## User Review Required

> [!WARNING]
> **Vercel is NOT suitable for your backend** because your code uses `Socket.io` for real-time updates. Vercel's serverless functions do not support persistent WebSocket connections.
>
> **Recommended Solution:**
> - **Frontend**: Deploy to **Vercel** (excellent for Next.js).
> - **Backend**: Deploy to **Render** or **Railway** (supports Socket.io and persistent servers).
> - **Database**: Use **MongoDB Atlas** (cloud-hosted database).

## Proposed Changes

### [Backend]
- Ensure `FRONTEND_URL` and `MONGODB_URI` are configurable via environment variables (already done in `server.js`).
- Add a `Dockerfile` or ensure `package.json` has a proper `start` script for Render.

### [Frontend]
- Update `API_URL` environment variable to point to the Render backend URL.

## Verification Plan

### Automated Tests
- Once deployed, use `curl` to verify the backend's `/` health check endpoint.

### Manual Verification
- Test real-time notifications/updates in the deployed frontend to confirm Socket.io connectivity.
