let mockServices = [
  {
    id: '1',
    name: 'auth-service',
    base_url: 'http://auth.internal',
    health_path: '/health',
    interval_seconds: 15,
    sla_threshold_ms: 200,
    owner_team: 'Security',
    environment: 'prod',
    status: 'healthy',
    latency_ms: 142,
    uptime_pct: 99.8,
    last_checked: new Date().toISOString()
  },
  {
    id: '2',
    name: 'payments-api',
    base_url: 'http://payments.internal',
    health_path: '/ping',
    interval_seconds: 30,
    sla_threshold_ms: 500,
    owner_team: 'Finance',
    environment: 'prod',
    status: 'down',
    latency_ms: null,
    uptime_pct: 88.5,
    last_checked: new Date().toISOString()
  },
  {
    id: '3',
    name: 'orders-worker',
    base_url: 'http://orders.internal',
    health_path: '/status',
    interval_seconds: 10,
    sla_threshold_ms: 100,
    owner_team: 'Core',
    environment: 'staging',
    status: 'healthy',
    latency_ms: 89,
    uptime_pct: 99.9,
    last_checked: new Date().toISOString()
  },
  {
    id: '4',
    name: 'inventory-sync',
    base_url: 'http://inventory.internal',
    health_path: '/healthz',
    interval_seconds: 60,
    sla_threshold_ms: 1000,
    owner_team: 'Logistics',
    environment: 'prod',
    status: 'degraded',
    latency_ms: 1340,
    uptime_pct: 97.2,
    last_checked: new Date().toISOString()
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getServices = async (params) => {
  await delay(400);
  let filtered = [...mockServices];
  if (params?.environment && params.environment !== 'all') {
    filtered = filtered.filter(s => s.environment === params.environment);
  }
  if (params?.team && params.team !== 'all') {
    filtered = filtered.filter(s => s.owner_team === params.team);
  }
  return { data: filtered };
};

export const createService = async (data) => {
  await delay(500);
  const newService = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    status: 'healthy',
    latency_ms: Math.floor(Math.random() * 150),
    uptime_pct: 100,
    last_checked: new Date().toISOString()
  };
  mockServices.push(newService);
  return { data: newService };
};

export const updateService = async (id, data) => {
  await delay(500);
  const index = mockServices.findIndex(s => s.id === id);
  if (index !== -1) {
    mockServices[index] = { ...mockServices[index], ...data };
    return { data: mockServices[index] };
  }
  throw new Error("Not found");
};

export const deleteService = async (id) => {
  await delay(400);
  mockServices = mockServices.filter(s => s.id !== id);
  return { data: { success: true } };
};

export const getServiceById = async (id) => {
  await delay(200);
  const service = mockServices.find(s => s.id === id);
  if (service) return { data: service };
  throw new Error("Not found");
}
