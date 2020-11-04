import { inject, setGlobalEffect } from "./h-state"

/**
 * Translate function.
 * 
 * @callback Translate
 * @param {string} key - Resource string id for which translation should be returned.
 * @return {string} - Translation for the key or key itself.
 */

/**
 * Sets current translation. To use translations you should inject "tr" variable which has type @see Translate .
 * 
 * @template S
 * @param {object} trans - Object with translations of the specified language.
 * @return {import("./h-state").EffectDef<S>} - Effect definition.
 */
export const setTranslate = (trans) => [setTranslateEffect, trans]

/**
 * Sets current language as global value.
 * 
 * @template S
 * @param {import("./h-state").FState<S>} fstate -
 * @param {object} trans - Translation object.
 * @return {void}
 */
function setTranslateEffect(fstate, trans) {
  let translation = flat(Object.entries(trans), '', {})
  setGlobalEffect(fstate, {name: "tr", value: key => translation[key] || key })
}

/**
 * Make flat object from entires.
 * 
 * @param {[string, any][]} entries -
 * @param {string} path -
 * @param {object} result - 
 * @return {object} -
 */
function flat(entries, path, result) {
  entries.forEach(e => {
    let name = path ? path + '.' + e[0] : e[0]
    if (typeof(e[1]) === "object") {
      flat(Object.entries(e[1]), name, result)
    } else {
      result[name] = e[1]
    }
  })
  return result
}

export const injectTranslate = action => inject("tr", action)