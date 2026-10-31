// BarbarAIn — the escape hatch (DATA_SPEC §4/§5). Named functions content may
// call with {script:'id'} as a condition or an effect. Keep this tiny: every
// use is listed by tools/validate.mjs. Signature: (api, kind, effect) where
// api = {S, R, DB, check, run, hooks, Inv} and kind is 'cond' or 'effect'.

export const SCRIPTS = {
  // Ain or Toktai present (for lines that suit either companion).
  companion_present: (api) => api.S.party.some(p => (p.id === 'toktai' || p.id === 'ain') && !p.frozen),
};
