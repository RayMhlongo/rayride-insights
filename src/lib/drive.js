import { emptyData } from './constants';
import { clearOfflineQueue, mergeData, normalizeData, readLocal, writeLocal } from './data';

const APP_FOLDER = 'InsightRides';
const FILES = {
  students: 'students.json',
  routes: 'routes.json',
  vehicles: 'vehicles.json',
  payments: 'payments.json',
};

const monthlyFile = (type, date = new Date()) => `${type}/${new Date(date).toISOString().slice(0, 7)}.json`;
const monthFromRecord = (record) => String(record?.date || new Date().toISOString()).slice(0, 7);

const env = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  folderId: import.meta.env.VITE_DRIVE_FOLDER_ID,
};

let tokenClient;
const TOKEN_KEY = 'insight-rides-google-token-v1';

class DriveError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'DriveError';
    this.cause = cause;
  }
}

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

export async function initGoogle() {
  if (!env.clientId || !env.apiKey) return { configured: false };
  try {
    await Promise.all([
      loadScript('https://apis.google.com/js/api.js'),
      loadScript('https://accounts.google.com/gsi/client'),
    ]);
    if (!window.gapi || !window.google?.accounts?.oauth2) throw new DriveError('Google scripts loaded but APIs are unavailable.');
    await new Promise((resolve, reject) => window.gapi.load('client', { callback: resolve, onerror: reject }));
    await window.gapi.client.init({
      apiKey: env.apiKey,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: env.clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: () => {},
    });
    const token = readStoredToken();
    if (token) window.gapi.client.setToken(token);
    return { configured: true, restored: Boolean(token) };
  } catch (error) {
    throw new DriveError('Google API initialization failed. Check your OAuth client, API key, and allowed origins.', error);
  }
}

export function signIn() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('Google OAuth is not configured.'));
    tokenClient.callback = (response) => {
      if (response.error) reject(response);
      else {
        const token = window.gapi.client.getToken();
        if (token) storeToken(token, response.expires_in);
        resolve(response);
      }
    };
    tokenClient.requestAccessToken({ prompt: window.gapi.client.getToken() ? '' : 'consent' });
  });
}

export function signOut() {
  const token = window.gapi?.client?.getToken?.();
  if (token) window.google.accounts.oauth2.revoke(token.access_token);
  window.gapi?.client?.setToken(null);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function hasDriveToken() {
  return Boolean(window.gapi?.client?.getToken?.()?.access_token);
}

function storeToken(token, expiresIn) {
  const expiresAt = Date.now() + Math.max(Number(expiresIn || 3300) - 60, 60) * 1000;
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ ...token, expiresAt }));
}

function readStoredToken() {
  try {
    const token = JSON.parse(sessionStorage.getItem(TOKEN_KEY));
    if (!token?.access_token || Date.now() > Number(token.expiresAt || 0)) return null;
    return token;
  } catch {
    return null;
  }
}

function requireToken() {
  const token = window.gapi?.client?.getToken?.();
  if (!token?.access_token) throw new DriveError('Google Drive is not authenticated. Sign in again and retry sync.');
  return token.access_token;
}

async function findFile(name, parentId) {
  try {
    const res = await window.gapi.client.drive.files.list({
      q: `name='${name.replaceAll("'", "\\'")}' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,modifiedTime)',
      spaces: 'drive',
    });
    return res.result.files?.[0];
  } catch (error) {
    throw new DriveError(`Could not search Google Drive for ${name}.`, error);
  }
}

async function createFolder(name, parentId) {
  const body = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId ? { parents: [parentId] } : {}),
  };
  try {
    const res = await window.gapi.client.drive.files.create({ resource: body, fields: 'id' });
    return res.result.id;
  } catch (error) {
    throw new DriveError(`Could not create Google Drive folder ${name}.`, error);
  }
}

async function ensureRootFolder() {
  if (env.folderId) return env.folderId;
  const existing = await findFile(APP_FOLDER, 'root');
  return existing?.id || createFolder(APP_FOLDER);
}

async function ensurePath(path, rootId) {
  const parts = path.split('/');
  let parentId = rootId;
  for (const part of parts.slice(0, -1)) {
    const existing = await findFile(part, parentId);
    parentId = existing?.id || (await createFolder(part, parentId));
  }
  return { parentId, name: parts.at(-1) };
}

async function readJson(path, fallback) {
  const rootId = await ensureRootFolder();
  const { parentId, name } = await ensurePath(path, rootId);
  const file = await findFile(name, parentId);
  if (!file) {
    await writeJson(path, fallback);
    return fallback;
  }
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${requireToken()}` },
  });
  if (!response.ok) throw new DriveError(`Could not read ${path} from Google Drive.`);
  try {
    return await response.json();
  } catch (error) {
    throw new DriveError(`${path} is not valid JSON. Restore or remove the file in Drive, then sync again.`, error);
  }
}

async function writeJson(path, payload) {
  const rootId = await ensureRootFolder();
  const { parentId, name } = await ensurePath(path, rootId);
  const existing = await findFile(name, parentId);
  const metadata = existing ? { name, mimeType: 'application/json' } : { name, mimeType: 'application/json', parents: [parentId] };
  const boundary = 'insight_rides_boundary';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(payload, null, 2),
    `--${boundary}--`,
  ].join('\r\n');
  const method = existing ? 'PATCH' : 'POST';
  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) throw new DriveError(`Could not write ${path} to Google Drive.`);
}

export async function loadDriveData() {
  const remote = normalizeData({
    ...emptyData,
    students: await readJson(FILES.students, emptyData.students),
    routes: await readJson(FILES.routes, emptyData.routes),
    vehicles: await readJson(FILES.vehicles, emptyData.vehicles),
    payments: await readJson(FILES.payments, emptyData.payments),
    trips: await readJson(monthlyFile('trips'), emptyData.trips),
    expenses: await readJson(monthlyFile('expenses'), emptyData.expenses),
    incomes: await readJson(monthlyFile('income'), emptyData.incomes),
  });
  const data = mergeData(readLocal(), remote);
  writeLocal(data);
  return data;
}

function monthlyWrites(type, rows) {
  const groups = new Map();
  for (const row of rows) {
    const month = monthFromRecord(row);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(row);
  }
  if (!groups.size) groups.set(monthFromRecord(), []);
  return [...groups.entries()].map(([month, values]) => writeJson(`${type}/${month}.json`, values));
}

async function writeAll(data) {
  await Promise.all([
    writeJson(FILES.students, data.students),
    writeJson(FILES.routes, data.routes),
    writeJson(FILES.vehicles, data.vehicles),
    writeJson(FILES.payments, data.payments),
    ...monthlyWrites('trips', data.trips),
    ...monthlyWrites('expenses', data.expenses),
    ...monthlyWrites('income', data.incomes),
  ]);
  writeLocal(data);
}

export async function saveDriveData(data) {
  const local = normalizeData(data);
  const remote = hasDriveToken() ? await loadDriveData() : emptyData;
  const merged = mergeData(local, remote);
  await writeAll(merged);
  clearOfflineQueue();
  return merged;
}

export { readLocal, writeLocal };
