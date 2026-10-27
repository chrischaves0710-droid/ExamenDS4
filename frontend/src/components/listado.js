import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { ErrorApi } from "../modules/errores.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;
let paginaActual = 1;
let ultimaPagina = 1;
let cantidadEnPagina = 0;
let numeroCarga = 0;
let iniciado = false;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

function dibujarEquipos(equipos) {
  const lista = document.querySelector("#lista-equipos");
  const plantilla = document.querySelector("#tpl-equipo");
  const contenido = document.createDocumentFragment();

  for (const equipo of equipos) {
    const tarjeta = plantilla.content.cloneNode(true).querySelector(".tarjeta");
    tarjeta.dataset.id = String(equipo.id);
    tarjeta.dataset.estado = equipo.estado;
    tarjeta.querySelector(".codigo").textContent = equipo.codigo;
    tarjeta.querySelector(".nombre").textContent = equipo.nombre;
    tarjeta.querySelector(".categoria").textContent = equipo.categoria?.nombre ?? "Sin categoría";
    tarjeta.querySelector(".fecha").textContent = formatearFecha(equipo.fecha_adquisicion);

    const estado = tarjeta.querySelector(".estado");
    estado.textContent = equipo.estado;
    estado.dataset.estado = equipo.estado;
    contenido.append(tarjeta);
  }

  if (equipos.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "No hay equipos para mostrar.";
    contenido.append(vacio);
  }

  lista.replaceChildren(contenido);
  cantidadEnPagina = equipos.length;
}

function actualizarPaginacion(meta, equipos) {
  paginaActual = Number(meta.current_page ?? paginaActual);
  ultimaPagina = Math.max(1, Number(meta.last_page ?? 1));
  const total = Number(meta.total ?? 0);
  const desde = total === 0 ? 0 : Number(meta.from ?? (paginaActual - 1) * POR_PAGINA + 1);
  const hasta = total === 0 ? 0 : Number(meta.to ?? desde + equipos.length - 1);

  document.querySelector("#resumen").textContent = `Mostrando ${desde}–${hasta} de ${total}`;
  document.querySelector("#pagina-actual").textContent = `Página ${paginaActual} de ${ultimaPagina}`;
  document.querySelector("#btn-anterior").disabled = paginaActual <= 1;
  document.querySelector("#btn-siguiente").disabled = paginaActual >= ultimaPagina;
}

export async function cargarPagina(pagina = paginaActual) {
  const lista = document.querySelector("#lista-equipos");
  const anterior = document.querySelector("#btn-anterior");
  const siguiente = document.querySelector("#btn-siguiente");
  const identificador = ++numeroCarga;

  lista.setAttribute("aria-busy", "true");
  anterior.disabled = true;
  siguiente.disabled = true;
  document.querySelector("#resumen").textContent = "Cargando equipos…";

  try {
    const respuesta = await listarEquipos(pagina, POR_PAGINA);
    if (identificador !== numeroCarga) return;

    const equipos = respuesta.data ?? [];
    const meta = respuesta.meta ?? {};
    const ultima = Math.max(1, Number(meta.last_page ?? 1));

    // Una eliminación concurrente puede dejar una página fuera de rango.
    if (equipos.length === 0 && pagina > ultima && pagina > 1) {
      await cargarPagina(ultima);
      return;
    }

    dibujarEquipos(equipos);
    actualizarPaginacion(meta, equipos);
  } catch (error) {
    if (identificador !== numeroCarga) return;
    document.querySelector("#resumen").textContent = "No se pudo cargar el inventario.";
    document.querySelector("#pagina-actual").textContent = "";
    mostrarMensaje("error", error.message);
  } finally {
    if (identificador === numeroCarga) {
      lista.setAttribute("aria-busy", "false");
      anterior.disabled = paginaActual <= 1;
      siguiente.disabled = paginaActual >= ultimaPagina;
    }
  }
}

async function manejarEliminacion(evento) {
  const boton = evento.target.closest(".btn-eliminar");
  const lista = document.querySelector("#lista-equipos");
  if (!boton || !lista.contains(boton)) return;

  const id = boton.closest(".tarjeta")?.dataset.id;
  if (!id || !window.confirm("¿Desea eliminar este equipo?")) return;

  boton.disabled = true;
  try {
    await eliminarEquipo(id);
    mostrarMensaje("exito", "Equipo eliminado correctamente.");
    const destino = paginaActual > 1 && cantidadEnPagina === 1 ? paginaActual - 1 : paginaActual;
    await cargarPagina(destino);
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 409) {
      mostrarMensaje("error", error.datos.mensaje ?? error.message);
    } else {
      mostrarMensaje("error", error.message);
    }
  } finally {
    boton.disabled = false;
  }
}

export function iniciarListado() {
  if (iniciado) return;
  iniciado = true;

  document.querySelector("#lista-equipos").addEventListener("click", manejarEliminacion);
  document.querySelector("#btn-anterior").addEventListener("click", () => {
    if (paginaActual > 1) cargarPagina(paginaActual - 1);
  });
  document.querySelector("#btn-siguiente").addEventListener("click", () => {
    if (paginaActual < ultimaPagina) cargarPagina(paginaActual + 1);
  });

  cargarPagina(1);
}
