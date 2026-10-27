import { BASE_URL, TIEMPO_MAXIMO_MS } from "./config.js";
import { obtenerToken, olvidarSesion } from "./auth.js";
import { ErrorApi } from "./errores.js";

// Todas las operaciones protegidas utilizan este mismo cliente HTTP.
export async function request(ruta, opciones = {}) {
  const controlador = new AbortController();
  const { signal: señalExterna, headers = {}, body, ...configuracion } = opciones;
  const cancelar = () => controlador.abort();

  if (señalExterna?.aborted) {
    controlador.abort();
  } else {
    señalExterna?.addEventListener("abort", cancelar, { once: true });
  }

  const limite = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);
  const token = obtenerToken();
  const tieneCuerpo = body !== undefined;
  const esFormulario = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    const respuesta = await fetch(`${BASE_URL.replace(/\/+$/, "")}/${ruta.replace(/^\/+/, "")}`, {
      ...configuracion,
      headers: {
        Accept: "application/json",
        ...(tieneCuerpo && !esFormulario ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(tieneCuerpo ? { body: esFormulario || typeof body === "string" ? body : JSON.stringify(body) } : {}),
      signal: controlador.signal,
    });

    if (respuesta.status === 204) return null;

    const tipo = respuesta.headers.get("content-type") ?? "";
    const datos = tipo.includes("json") ? await respuesta.json() : {};

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        olvidarSesion();
        window.location.reload();
      }
      throw new ErrorApi(respuesta.status, datos);
    }

    return datos;
  } catch (error) {
    if (error instanceof ErrorApi) throw error;
    if (error?.name === "AbortError") {
      throw new Error("La petición fue cancelada o superó los 8 segundos.");
    }
    throw new Error("No fue posible conectar con la API.");
  } finally {
    clearTimeout(limite);
    señalExterna?.removeEventListener("abort", cancelar);
  }
}
