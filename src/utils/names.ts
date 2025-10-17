export function sectorDisplayName(opts: {
  placeType?: string;      // 'enumerated' | 'nonEnumerated' | 'hybrid'
  sectorType?: string;     // 'enumerated' | 'nonEnumerated'
  name?: string;           // nombre real
  publicAlias?: string | null;
}) {
  const sectorT = (opts.sectorType || '').toLowerCase();
  if (sectorT === 'nonenumerated') {
    return opts.publicAlias?.trim() || 'Entrada General';
  }
  return opts.name || 'Sector';
}
