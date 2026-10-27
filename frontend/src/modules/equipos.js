import { request } from "./api.js";

// La firma (pagina, porPagina) se mantiene para los componentes del proyecto base.
export function listarEquipos(pagina = 1, porPagina = 6, filtros = {}) {
  const parametros = new URLSearchParams({
    page: String(pagina),
    per_page: String(porPagina),
  });

  if (filtros.q?.trim()) parametros.set("q", filtros.q.trim());
  if (filtros.estado) parametros.set("estado", filtros.estado);

  return request(`equipos?${parametros.toString()}`);
}

export function listarCategorias() {
  return request("categorias");
}

export function crearEquipo(datos) {
  return request("equipos", { method: "POST", body: datos });
}

export function eliminarEquipo(id) {
  return request(`equipos/${encodeURIComponent(id)}`, { method: "DELETE" });
}
