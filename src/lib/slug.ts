/**
 * Gera um slug a partir de uma string
 * @param text - Texto para converter em slug
 * @returns Slug gerado
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Normaliza caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .replace(/^-|-$/g, ""); // Remove hífens do início e fim
}

/**
 * Gera um slug único combinando o slug base com um ID
 * @param text - Texto para converter em slug
 * @param id - ID único para garantir unicidade
 * @returns Slug único
 */
export function generateUniqueSlug(text: string, id: string): string {
  const baseSlug = generateSlug(text);
  const shortId = id.substring(0, 8); // Usa apenas os primeiros 8 caracteres do ID
  return `${baseSlug}-${shortId}`;
}

/**
 * Extrai o ID de um slug único
 * @param slug - Slug único
 * @returns ID extraído ou null se não encontrado
 */
export function extractIdFromSlug(slug: string): string | null {
  // Primeiro, tenta encontrar um UUID completo no slug
  const uuidMatch = slug.match(
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i
  );
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // Se não encontrou UUID completo, tenta extrair o ID parcial
  const parts = slug.split("-");
  if (parts.length < 2) return null;

  const lastPart = parts[parts.length - 1];
  // Verifica se a última parte parece ser um ID (8 caracteres alfanuméricos)
  if (/^[a-f0-9]{8}$/i.test(lastPart)) {
    return lastPart;
  }

  return null;
}
