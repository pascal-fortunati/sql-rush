/* Configuration unique des FlyonUI Advanced Select : un seul style pour tout le site.
   Le <select> d'origine reste la source de vérité ; le plugin ne fait que l'habiller. */
const ATTRIBUTE = {'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;'};
const escapeAttribute = value => value.replace(/[&<>']/g, c => ATTRIBUTE[c]);

const icon = (name, classes = '') => `<span class="material-symbols-rounded ${classes}" aria-hidden="true">${name}</span>`;

export function advancedSelect({placeholder = 'Choisir…', search = false, searchPlaceholder = 'Rechercher…'} = {}) {
  const config = {
    placeholder,
    toggleTag: `<button type="button" aria-expanded="false"><span class="advance-select-value" data-title></span>${icon('expand_more', 'advance-select-chevron')}</button>`,
    toggleClasses: 'advance-select-toggle select-disabled:pointer-events-none select-disabled:opacity-40',
    dropdownClasses: 'advance-select-menu',
    optionClasses: 'advance-select-option selected:select-active',
    optionTemplate: `<div class="advance-select-row"><span data-title></span>${icon('check', 'advance-select-check')}</div>`,
    ...(search ? {
      hasSearch: true,
      searchPlaceholder,
      searchWrapperClasses: 'advance-select-search-wrap',
      searchClasses: 'advance-select-search',
      searchNoResultText: 'Aucun résultat',
      searchNoResultClasses: 'advance-select-empty'
    } : {})
  };
  return escapeAttribute(JSON.stringify(config));
}
