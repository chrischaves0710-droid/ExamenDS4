import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { ErrorApi } from "../modules/errores.js";
import { mostrarMensaje } from "./mensajes.js";

let iniciado = false;

function limpiarErrores(formulario) {
  formulario.querySelectorAll("[data-error]").forEach(parrafo => {
    parrafo.textContent = "";
  });
  formulario.querySelectorAll("[aria-invalid]").forEach(campo => {
    campo.removeAttribute("aria-invalid");
  });
}

function mostrarErrores(formulario, errores) {
  for (const [nombre, mensajes] of Object.entries(errores)) {
    const campo = formulario.elements.namedItem(nombre);
    const parrafo = formulario.querySelector(`[data-error="${nombre}"]`);
    if (campo) campo.setAttribute("aria-invalid", "true");
    if (parrafo) parrafo.textContent = Array.isArray(mensajes) ? mensajes.join(" ") : String(mensajes);
  }
}

async function cargarCategorias(formulario) {
  const select = formulario.elements.namedItem("categoria_id");
  try {
    const respuesta = await listarCategorias();
    select.replaceChildren(new Option("Seleccione…", ""));
    for (const categoria of respuesta.data ?? []) {
      select.append(new Option(categoria.nombre, String(categoria.id)));
    }
  } catch (error) {
    mostrarMensaje("error", `No se pudieron cargar las categorías: ${error.message}`);
  }
}

// main.js proporciona el callback para actualizar el listado tras guardar.
export function iniciarFormulario({ alGuardar } = {}) {
  if (iniciado) return;
  iniciado = true;

  const formulario = document.querySelector("#form-equipo");
  const boton = document.querySelector("#btn-guardar");
  cargarCategorias(formulario);

  formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    limpiarErrores(formulario);

    const datos = Object.fromEntries(new FormData(formulario).entries());
    datos.categoria_id = datos.categoria_id === "" ? null : Number(datos.categoria_id);
    datos.costo_interno = datos.costo_interno === "" ? null : Number(datos.costo_interno);

    const textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Guardando…";

    try {
      await crearEquipo(datos);
      formulario.reset();
      mostrarMensaje("exito", "Equipo registrado correctamente.");
      await alGuardar?.();
    } catch (error) {
      if (error instanceof ErrorApi && error.status === 422) {
        mostrarErrores(formulario, error.datos.errors ?? {});
        mostrarMensaje("error", "Revise los campos señalados.");
      } else {
        mostrarMensaje("error", error.message);
      }
    } finally {
      boton.disabled = false;
      boton.textContent = textoOriginal;
    }
  });
}
