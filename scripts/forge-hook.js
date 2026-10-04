import { MODULE_ID } from "./constants.js";
import {
  getAllCategories,
  getNativeCategories,
  getCustomCategories,
} from "./categories.js";

let categoriesCache = null;

/**
 * Convierte "mi-categoria" en "Mi Categoria" para mostrar en el desplegable.
 * El valor real (value) seguirá siendo "mi-categoria".
 */
function capitalizeCategory(name) {
  return String(name)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Devuelve la lista de categorías (nativas + custom) y la cachea.
 */
async function getCategories() {
  if (categoriesCache) return categoriesCache;
  const native = await getNativeCategories();
  const custom = getCustomCategories();
  categoriesCache = { native, custom };
  return categoriesCache;
}

/**
 * Limpia la caché cuando cambien las categorías o cualidades.
 */
export function invalidateCategoriesCache() {
  categoriesCache = null;
}

/**
 * Hook que se dispara después de que se renderice cualquier ApplicationV2.
 * Detectamos si es la Forja de Objetos y modificamos el <select> de categorías.
 */
export function registerForgeHook() {
  Hooks.on("renderApplicationV2", async (app, html, data) => {
    // Detectar la Forja de Objetos por su ID o por la presencia del selector
    const $html = html instanceof HTMLElement ? $(html) : html;
    const $select = $html.find("#qualitiesCategory");
    if (!$select.length) return;

    // Es la Forja. Vamos a modificar el desplegable.
    await modifyCategoryDropdown($select);
  });
}

/**
 * Modifica el <select> de categorías:
 *  - Añade las categorías personalizadas que no estén ya.
 *  - Si hideNativeQualities está activo, elimina las opciones nativas.
 */
async function modifyCategoryDropdown($select) {
  const hideNative = game.settings.get(MODULE_ID, "hideNativeQualities");
  const { native, custom } = await getCategories();

  // 1. Obtener las opciones actuales (nativas de Lookfar)
  const currentValues = new Set();
  $select.find("option").each(function () {
    currentValues.add($(this).val());
  });

  // 2. Si hideNative está activo, eliminar las opciones nativas
  if (hideNative) {
    // Las categorías nativas están en `native` (las que devuelve dataLoader)
    for (const cat of native) {
      $select.find(`option[value="${cat}"]`).remove();
    }
    // También eliminamos las básicas que siempre están
    $select.find('option[value="basic"]').remove();
  }

  // 3. Añadir las categorías personalizadas que no existan
  for (const cat of custom) {
    if (!currentValues.has(cat)) {
      // Capitalizar la primera letra y convertir guiones en espacios
      const display = capitalizeCategory(cat);
      $select.append(new Option(display, cat));
    }
  }

  // 4. Asegurarnos de que la opción "custom" sigue existiendo (es la que usa tu bloque custom)
  if (!$select.find('option[value="custom"]').length) {
    $select.append(new Option("Custom", "custom"));
  }
}
