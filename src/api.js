// src/api.js — thin fetch wrapper for all Vercel API routes

const BASE = import.meta.env.VITE_API_BASE ?? '';

async function req(method, path, body) {
  const res = await fetch(`${BASE}/api/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

// ── Devices ──────────────────────────────────────────────────────────
export const api = {
  devices: {
    list:   ()      => req('GET',    'devices'),
    create: (data)  => req('POST',   'devices', data),
    update: (data)  => req('PUT',    'devices', data),
    remove: (id)    => req('DELETE', `devices?id=${id}`),
  },
  users: {
    list:   ()      => req('GET',    'users'),
    create: (data)  => req('POST',   'users', data),
    update: (data)  => req('PUT',    'users', data),
    remove: (id)    => req('DELETE', `users?id=${id}`),
  },
  software: {
    list:   ()      => req('GET',    'software'),
    create: (data)  => req('POST',   'software', data),
    update: (data)  => req('PUT',    'software', data),
    remove: (id)    => req('DELETE', `software?id=${id}`),
  },
  swmap: {
    list:   ()      => req('GET',    'swmap'),
    create: (data)  => req('POST',   'swmap', data),
    remove: (id)    => req('DELETE', `swmap?id=${id}`),
  },
};
