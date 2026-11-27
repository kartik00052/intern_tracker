const PREFIX = 'internship-intelligence:';

const read = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const STATUSES = ['Interested', 'Applied', 'Interview', 'Rejected', 'Offer'];

export const savedStatuses = STATUSES;

export function getSaved() {
  const value = read('saved', {});
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

export function setSaved(id, meta = {}) {
  const saved = getSaved();
  saved[id] = {
    savedAt: new Date().toISOString(),
    note: '',
    status: 'Interested',
    ...saved[id],
    ...meta,
  };
  return write('saved', saved);
}

export function removeSaved(id) {
  const saved = getSaved();
  delete saved[id];
  return write('saved', saved);
}

export function toggleSaved(id) {
  if (getSaved()[id]) {
    removeSaved(id);
    return false;
  }
  setSaved(id);
  return true;
}

export function updateSavedMeta(id, patch) {
  const saved = getSaved();
  if (!saved[id]) return false;
  saved[id] = { ...saved[id], ...patch };
  return write('saved', saved);
}

export function clearSaved() {
  return write('saved', {});
}

const DEFAULT_PREFS = { view: 'table', railCollapsed: false, sort: 'newest', pageSize: 10 };

export function getPrefs() {
  return { ...DEFAULT_PREFS, ...(read('prefs', {}) || {}) };
}

export function setPrefs(patch) {
  const next = { ...getPrefs(), ...patch };
  write('prefs', next);
  return next;
}

export function getLastFilters() {
  return read('filters', {}) || {};
}

export function setLastFilters(filters) {
  return write('filters', filters);
}
