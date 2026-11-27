const decode = (value) => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
};

export function parseHash(hash = window.location.hash) {
  const raw = String(hash || '').replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean).map(decode);
  const query = {};
  queryPart.split('&').filter(Boolean).forEach((pair) => {
    const [rawKey, rawValue = ''] = pair.split('=');
    query[decode(rawKey)] = decode(rawValue);
  });
  const name = parts[0] || 'overview';
  return {
    name,
    parts,
    id: parts[1] || null,
    query,
    path: `/${parts.join('/')}`,
  };
}

export function buildHash(path, query = {}) {
  const cleanPath = `/${String(path || '/').replace(/^\/+|\/+$/g, '')}`.replace(/^\/$/, '/');
  const pairs = Object.entries(query)
    .filter(([, value]) => value !== '' && value != null && value !== false)
    .map(([key, value]) => {
      const normalized = Array.isArray(value) ? value.join(',') : value === true ? '1' : String(value);
      return `${encodeURIComponent(key)}=${encodeURIComponent(normalized)}`;
    });
  return `#${cleanPath}${pairs.length ? `?${pairs.join('&')}` : ''}`;
}

export function navigate(path, query = {}, options = {}) {
  const next = buildHash(path, query);
  if (window.location.hash === next) {
    if (options.replace) window.history.replaceState(null, '', next);
    window.dispatchEvent(new Event('hashchange'));
    return;
  }
  if (options.replace) window.history.replaceState(null, '', next);
  else window.location.hash = next;
}

export function splitList(value) {
  return value ? String(value).split(',').filter(Boolean) : [];
}
