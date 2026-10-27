import { crearEquipo, obtenerCategorias } from '../modules/equipos.js';
import { ErrorApi } from '../modules/api.js';
import { cargarListado } from './listado.js';

let iniciado = false;

function limpiarErrores(formulario) {
  formulario.querySelectorAll('[data-error]').forEach(nodo => { nodo.textContent = ''; });
  formulario.querySelectorAll('[aria-invalid]').forEach(campo => {
    campo.removeAttribute('aria-invalid');
  });
}

function mostrarErrores(formulario, errores) {
  for (const [nombre, mensajes] of Object.entries(errores)) {
    const campo = formulario.elements.namedItem(nombre);
    const parrafo = formulario.querySelector(`[data-error="${nombre}"]`);
    if (campo?.setAttribute) campo.setAttribute('aria-invalid', 'true');
    if (parrafo) parrafo.textContent = Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes);
  }
}

async function cargarCategorias(formulario) {
  const select = formulario.elements.namedItem('categoria_id');
  if (!select) return;
  try {
    const respuesta = await obtenerCategorias();
    select.replaceChildren(new Option('Seleccione una categoría', ''));
    for (const categoria of respuesta.data || []) {
      select.append(new Option(categoria.nombre, String(categoria.id)));
    }
  } catch (error) {
    const mensaje = document.querySelector('#mensaje-formulario');
    if (mensaje) mensaje.textContent = `No se cargaron las categorías: ${error.message}`;
  }
}

export function iniciarFormulario() {
  if (iniciado) return;
  const formulario = document.querySelector('#form-equipo');
  if (!formulario) return;
  iniciado = true;
  const boton = formulario.querySelector('[type="submit"]');
  const mensaje = document.querySelector('#mensaje-formulario');
  cargarCategorias(formulario);

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    limpiarErrores(formulario);
    if (mensaje) mensaje.textContent = '';
    const datos = Object.fromEntries(new FormData(formulario).entries());
    datos.categoria_id = Number(datos.categoria_id);
    datos.costo_interno = Number(datos.costo_interno);
    if (!datos.estado) delete datos.estado;
    const etiqueta = boton?.textContent;
    if (boton) { boton.disabled = true; boton.textContent = 'Guardando…'; }
    try {
      await crearEquipo(datos);
      formulario.reset();
      if (mensaje) mensaje.textContent = 'Equipo guardado correctamente.';
      await cargarListado(1);
    } catch (error) {
      if (error instanceof ErrorApi && error.status === 422) {
        mostrarErrores(formulario, error.errores);
        if (mensaje) mensaje.textContent = 'Revise los campos señalados.';
      } else if (mensaje) {
        mensaje.textContent = error.message;
      }
    } finally {
      if (boton) { boton.disabled = false; boton.textContent = etiqueta; }
    }
  });
}

export default iniciarFormulario;
