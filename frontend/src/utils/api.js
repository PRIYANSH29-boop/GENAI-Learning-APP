const API = (import.meta.env.VITE_API_URL ?? "http://localhost:3001") + "/api";

async function parseJson(res) {
  if (!res.ok) {
    const text = await res.text();
    const err  = new Error(text || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function registerUser(name, email, password) {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return parseJson(res);
}

export async function loginUser(email, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseJson(res);
}

export async function resendVerification(email) {
  const res = await fetch(`${API}/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseJson(res);
}

export async function getProfile(userId) {
  const res = await fetch(`${API}/users/${userId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function updateProfile(userId, data) {
  const res = await fetch(`${API}/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function recordProgress(userId, lessonId) {
  const res = await fetch(`${API}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, lesson_id: lessonId }),
  });
  return parseJson(res);
}

export async function recordCertificate(userId) {
  const res = await fetch(`${API}/certificate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  return parseJson(res);
}

export async function getStats() {
  const res = await fetch(`${API}/stats`);
  return parseJson(res);
}

// Returns { coursePaymentAddress, lessonPriceEth, bundlePriceEth, chainId }
export async function getConfig() {
  const res = await fetch(`${API}/config`);
  return parseJson(res);
}

// Returns array of Payment documents for this user
export async function getUserPayments(userId) {
  const res = await fetch(`${API}/payments/${userId}`);
  return parseJson(res);
}

// Alias kept for any callers that used the old name
export const getPayments = getUserPayments;

// Records a MetaMask payment after the tx is confirmed on-chain
export async function verifyPayment({ user_id, tx_hash, payment_type, lesson_id, wallet_address }) {
  const res = await fetch(`${API}/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, tx_hash, payment_type, lesson_id, wallet_address }),
  });
  return parseJson(res);
}
