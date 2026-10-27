const URL_BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
const CLAVES_TOKEN = ['auth_token', 'token'];

export class ErrorApi extends Error {
  constructor(mensaje, status, errores = {}) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.estado = status;
    this.errores = errores;
  }
}

export async function request(ruta, opciones = {}) {
  const token = CLAVES_TOKEN.map(clave => localStorage.getItem(clave)).find(Boolean);
  const controlador = new AbortController();
  const { signal: señalExterna, headers: encabezados = {}, body, ...resto } = opciones;
  const alCancelar = () => controlador.abort();
  if (señalExterna?.aborted) controlador.abort();
  else señalExterna?.addEventListener('abort', alCancelar, { once: true });
  const tiempo = setTimeout(() => controlador.abort(), 8000);
  const esFormulario = typeof FormData !== 'undefined' && body instanceof FormData;
  const tieneCuerpo = body !== undefined;

  try {
    const respuesta = await fetch(`${URL_BASE}/${ruta.replace(/^\/+/, '')}`, {
      ...resto,
      headers: {
        Accept: 'application/json',
        ...(tieneCuerpo && !esFormulario ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...encabezados,
      },
      ...(tieneCuerpo ? { body: esFormulario || typeof body === 'string' ? body : JSON.stringify(body) } : {}),
      signal: controlador.signal,
    });

    if (respuesta.status === 204) return null;
    const tipo = respuesta.headers.get('content-type') || '';
    const datos = tipo.includes('application/json') ? await respuesta.json() : null;

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        CLAVES_TOKEN.forEach(clave => localStorage.removeItem(clave));
        window.location.reload();
      }
      throw new ErrorApi(
        datos?.mensaje || datos?.message || `Error HTTP ${respuesta.status}`,
        respuesta.status,
        datos?.errors || {},
      );
    }
    return datos;
  } catch (error) {
    if (error instanceof ErrorApi) throw error;
    if (error.name === 'AbortError') {
      throw new ErrorApi('La petición fue cancelada o superó los 8 segundos.', 0);
    }
    throw new ErrorApi('No fue posible conectar con la API.', 0);
  } finally {
    clearTimeout(tiempo);
    señalExterna?.removeEventListener('abort', alCancelar);
  }
}
