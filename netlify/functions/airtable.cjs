const TABLES = new Set(['Users', 'Projects', 'Time Entries', 'Clients']);
const METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function airtableUrl(baseId, tableName, recordId = '', query = '') {
  const encodedTable = encodeURIComponent(tableName);
  const suffix = query ? `?${query}` : '';
  return `https://api.airtable.com/v0/${baseId}/${encodedTable}${recordId ? `/${recordId}` : ''}${suffix}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { message: 'Method not allowed' });
  }

  const baseId = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN || process.env.VITE_AIRTABLE_TOKEN;
  if (!baseId || !token) {
    return json(500, { message: 'Airtable environment variables are missing' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { message: 'Invalid JSON body' });
  }

  const tableName = String(payload.tableName || '');
  const method = String(payload.method || 'GET').toUpperCase();
  const recordId = payload.recordId ? String(payload.recordId) : '';
  const query = payload.query ? String(payload.query) : '';
  const fields = payload.fields;

  if (!TABLES.has(tableName)) return json(400, { message: 'Invalid Airtable table' });
  if (!METHODS.has(method)) return json(400, { message: 'Invalid Airtable method' });

  const response = await fetch(airtableUrl(baseId, tableName, recordId, query), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: method === 'POST' || method === 'PATCH' ? JSON.stringify({ fields }) : undefined
  });

  const text = await response.text();
  return {
    statusCode: response.status,
    headers: { 'Content-Type': 'application/json' },
    body: text || '{}'
  };
};
