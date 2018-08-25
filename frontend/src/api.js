let prefix = window.location.pathname;
prefix = prefix.substring(0, prefix.length - 1);

async function get(path) {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  return await fetch(prefix + path, {
    method: 'GET',
    headers: headers,
    credentials: 'include',
  });
}

async function post(path, data) {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  return await fetch(prefix + path, {
    method: 'POST',
    headers: headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });
}

async function putRaw(path, data) {
  return await fetch(prefix + path, {
    method: 'PUT',
    credentials: 'include',
    body: data,
  });
}

const api = {
  get: get,
  post: post,
  putRaw: putRaw,
};

export default api;
