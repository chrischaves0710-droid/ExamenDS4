import { listarEquipos, eliminarEquipo } from '../modules/equipos.js';
import { ErrorApi } from '../modules/api.js';

let paginaActual = 1;
let ultimaPagina = 1;
let iniciado = false;
let idCarga = 0;
let elementos = null;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

function buscarElementos() {
  return {
    lista: document.querySelector('#lista-equipos'),
    plantilla: document.querySelector('#tpl-equipo'),
    resumen: document.querySelector('#resumen'),
    pagina: document.querySelector('#pagina-actual'),
    anterior: document.querySelector('#anterior'),
    siguiente: document.querySelector('#siguiente'),
    mensaje: document.querySelector('#mensaje-listado'),
    busqueda: document.querySelector('#busqueda'),
    estado: document.querySelector('#filtro-estado'),
  };
}

function texto(nodo, valor) {
  if (nodo) nodo.textContent = String(valor ?? '');
}

function dibujar(equipos) {
  const { lista, plantilla } = elementos;
  lista.replaceChildren();
  for (const equipo of equipos) {
    const fragmento = plantilla.content.cloneNode(true);
    const tarjeta = fragmento.querySelector('[data-equipo]') || fragmento.firstElementChild;
    if (!tarjeta) continue;
    tarjeta.dataset.id = String(equipo.id);
    tarjeta.dataset.estado = equipo.estado;
    texto(tarjeta.querySelector('[data-codigo]'), equipo.codigo);
    texto(tarjeta.querySelector('[data-nombre]'), equipo.nombre);
    texto(tarjeta.querySelector('[data-categoria]'), equipo.categoria?.nombre ?? 'Sin categoría');
    texto(tarjeta.querySelector('[data-estado-texto]'), equipo.estado);
    texto(tarjeta.querySelector('[data-fecha]'), equipo.fecha_adquisicion);
    const boton = tarjeta.querySelector('[data-eliminar]');
    if (boton) boton.dataset.id = String(equipo.id);
    lista.append(fragmento);
  }
  if (!equipos.length) texto(elementos.mensaje, 'No hay equipos para mostrar.');
}

export async function cargarListado(pagina = paginaActual) {
  if (!elementos) elementos = buscarElementos();
  if (!elementos.lista || !elementos.plantilla) return;
  const carga = ++idCarga;
  elementos.lista.setAttribute('aria-busy', 'true');
  texto(elementos.mensaje, 'Cargando equipos…');
  try {
    const respuesta = await listarEquipos({
      pagina, porPagina: 6,
      q: elementos.busqueda?.value || '',
      estado: elementos.estado?.value || '',
    });
    if (carga !== idCarga) return;
    const equipos = respuesta.data || [];
    const meta = respuesta.meta || {};
    paginaActual = Number(meta.current_page || pagina);
    ultimaPagina = Math.max(1, Number(meta.last_page || 1));
    dibujar(equipos);
    const total = Number(meta.total || 0);
    const inicio = total ? Number(meta.from || (paginaActual - 1) * 6 + 1) : 0;
    const fin = total ? Number(meta.to || inicio + equipos.length - 1) : 0;
    texto(elementos.resumen, `Mostrando ${inicio}–${fin} de ${total}`);
    texto(elementos.pagina, `Página ${paginaActual} de ${ultimaPagina}`);
    if (elementos.anterior) elementos.anterior.disabled = paginaActual <= 1;
    if (elementos.siguiente) elementos.siguiente.disabled = paginaActual >= ultimaPagina;
    if (equipos.length) texto(elementos.mensaje, '');
  } catch (error) {
    if (carga === idCarga) texto(elementos.mensaje, error.message);
  } finally {
    if (carga === idCarga) elementos.lista.setAttribute('aria-busy', 'false');
  }
}

async function manejarEliminar(evento) {
  const boton = evento.target.closest('[data-eliminar]');
  if (!boton || !elementos.lista.contains(boton)) return;
  const id = boton.dataset.id || boton.closest('[data-id]')?.dataset.id;
  if (!id || !window.confirm('¿Desea eliminar este equipo?')) return;
  boton.disabled = true;
  texto(elementos.mensaje, 'Eliminando equipo…');
  try {
    await eliminarEquipo(id);
    await cargarListado(paginaActual);
    if (!elementos.lista.children.length && paginaActual > 1) {
      await cargarListado(paginaActual - 1);
    }
  } catch (error) {
    texto(elementos.mensaje, error instanceof ErrorApi && error.status === 409
      ? error.message : `No se pudo eliminar: ${error.message}`);
  } finally {
    boton.disabled = false;
  }
}

export function iniciarListado() {
  if (iniciado) return;
  elementos = buscarElementos();
  if (!elementos.lista || !elementos.plantilla) return;
  iniciado = true;
  elementos.lista.addEventListener('click', manejarEliminar);
  elementos.anterior?.addEventListener('click', () => {
    if (paginaActual > 1) cargarListado(paginaActual - 1);
  });
  elementos.siguiente?.addEventListener('click', () => {
    if (paginaActual < ultimaPagina) cargarListado(paginaActual + 1);
  });
  let reloj;
  elementos.busqueda?.addEventListener('input', () => {
    clearTimeout(reloj);
    reloj = setTimeout(() => cargarListado(1), 250);
  });
  elementos.estado?.addEventListener('change', () => cargarListado(1));
  cargarListado(1);
}

export default iniciarListado;
