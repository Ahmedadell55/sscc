// ═══════════════════════════════════════════════════
//  دَرْب AI — API Service Layer
//  كل الـ API calls في مكان واحد — استبدل BASE_URL
//  بعنوان الـ backend الحقيقي عند الربط
// ═══════════════════════════════════════════════════

const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.darb-ai.com/v1';

// ── Helpers ─────────────────────────────────────────
function getToken() {
  return localStorage.getItem('darb_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'خطأ في الخادم' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

const get  = (path)        => request('GET',    path);
const post = (path, body)  => request('POST',   path, body);
const put  = (path, body)  => request('PUT',    path, body);
const patch= (path, body)  => request('PATCH',  path, body);
const del  = (path)        => request('DELETE', path);

// ── Auth ─────────────────────────────────────────────
export const authAPI = {
  // POST /auth/login  → { token, user }
  login: (email, password) => post('/auth/login', { email, password }),

  // POST /auth/register → { token, user }
  register: (name, email, password) => post('/auth/register', { name, email, password }),

  // POST /auth/logout
  logout: () => post('/auth/logout'),

  // POST /auth/forgot-password
  forgotPassword: (email) => post('/auth/forgot-password', { email }),

  // POST /auth/google  → { token, user }
  googleAuth: (credential) => post('/auth/google', { credential }),
};

// ── User ─────────────────────────────────────────────
export const userAPI = {
  // GET /user/me → { id, name, email, avatar, plan, points, level, rank }
  getMe: () => get('/user/me'),

  // PATCH /user/me → updated user
  updateMe: (data) => patch('/user/me', data),
};

// ── Projects ─────────────────────────────────────────
export const projectsAPI = {
  // GET /projects → [{ id, name, nodes, edges, updatedAt }]
  list: () => get('/projects'),

  // POST /projects  → { id, ... }
  create: (name, nodes, edges) => post('/projects', { name, nodes, edges }),

  // PUT /projects/:id
  update: (id, name, nodes, edges) => put(`/projects/${id}`, { name, nodes, edges }),

  // DELETE /projects/:id
  remove: (id) => del(`/projects/${id}`),
};

// ── Traffic ──────────────────────────────────────────
export const trafficAPI = {
  // GET /traffic/live → [{ name, pct, level }]
  getLive: () => get('/traffic/live'),

  // GET /traffic/events → [{ id, type, color, text }]
  getEvents: () => get('/traffic/events'),

  // GET /traffic/signals → [{ id, x, y, phase, status, waitTime }]
  getSignals: () => get('/traffic/signals'),

  // GET /traffic/chart?date=today → [{ label, value, level }]
  getChart: () => get('/traffic/chart?date=today'),
};

// ── Routing / Algorithm ──────────────────────────────
export const routingAPI = {
  // POST /routing/calculate → { path, distance, duration, fuel, co2 }
  calculate: (nodes, edges, startId, endId, algo, priority) =>
    post('/routing/calculate', { nodes, edges, startId, endId, algo, priority }),

  // GET /routing/eco-routes?from=&to= → [{ id, label, ... }]
  getEcoRoutes: (from, to) => get(`/routing/eco-routes?from=${from}&to=${to}`),

  // GET /routing/departure-windows?from=&to= → [{ time, trafficPct, ... }]
  getDepartureWindows: (from, to) => get(`/routing/departure-windows?from=${from}&to=${to}`),
};

// ── Fleet ────────────────────────────────────────────
export const fleetAPI = {
  // GET /fleet/vehicles → [{ id, name, status, ... }]
  getVehicles: () => get('/fleet/vehicles'),

  // GET /fleet/stats → { active, idle, alert, coverage }
  getStats: () => get('/fleet/stats'),

  // PATCH /fleet/vehicles/:id → updated vehicle
  updateVehicle: (id, data) => patch(`/fleet/vehicles/${id}`, data),
};

// ── Parking ──────────────────────────────────────────
export const parkingAPI = {
  // GET /parking/lots → [{ id, name, available, capacity, ... }]
  getLots: () => get('/parking/lots'),

  // POST /parking/reserve → { reservationId }
  reserve: (lotId) => post('/parking/reserve', { lotId }),
};

// ── Gamification ─────────────────────────────────────
export const gamificationAPI = {
  // GET /gamification/badges → [{ id, name, icon, earned }]
  getBadges: () => get('/gamification/badges'),

  // GET /gamification/leaderboard → [{ rank, name, points, ... }]
  getLeaderboard: () => get('/gamification/leaderboard'),

  // POST /gamification/points → { newTotal }
  addPoints: (amount, reason) => post('/gamification/points', { amount, reason }),
};

// ── Driving Analytics ────────────────────────────────
export const analyticsAPI = {
  // GET /analytics/driving → { score, grade, trips, ... }
  getDriving: () => get('/analytics/driving'),

  // POST /analytics/trip → saves trip data
  saveTrip: (tripData) => post('/analytics/trip', tripData),
};

// ── Voice / AI ───────────────────────────────────────
export const voiceAPI = {
  // POST /voice/query → { response, action? }
  query: (text, context) => post('/voice/query', { text, context }),
};

// ── City Analysis ────────────────────────────────────
export const cityAPI = {
  // POST /city/analyze → { totalNodes, congested, suggestions, ... }
  analyze: (nodes, edges) => post('/city/analyze', { nodes, edges }),
};
