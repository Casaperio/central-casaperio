/**
 * Normaliza o nome do hóspede para chave consistente de lookup.
 * Regra: lowercase, trim, remove acentos, colapsa espaços e troca por "-".
 */
export function normalizeGuestKey(name: string): string {
  if (!name) return '';

  const collapsed = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ');

  return collapsed.replace(/\s/g, '-');
}
