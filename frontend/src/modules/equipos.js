import { request } from './api.js';

export function listarEquipos({ pagina = 1, porPagina = 6, q = '', estado = '' } = {}) {
  const parametros = new URLSearchParams({
    page: String(pagina),
    per_page: String(porPagina),
  });
  if (q.trim()) parametros.set('q', q.trim());
  if (estado) parametros.set('estado', estado);
  return request(`equipos?${parametros}`);
}

export function obtenerCategorias() {
  return request('categorias');
}

export function crearEquipo(datos) {
  return request('equipos', { method: 'POST', body: datos });
}

export function eliminarEquipo(id) {
  return request(`equipos/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
