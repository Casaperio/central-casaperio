/**
 * 📞 Phone Formatter Utilities
 * 
 * Formatação inteligente de números de telefone:
 * - Detecta telefones internacionais (com código de país)
 * - Formata telefones brasileiros no padrão (DD) 9XXXX-XXXX
 * - Preserva + para números internacionais
 * - Remove caracteres não numéricos
 */

/**
 * Detecta se um telefone é internacional (tem código de país)
 */
export function isInternationalPhone(phone: string): boolean {
  if (!phone) return false;
  
  const cleaned = phone.trim();
  
  // Começa com +
  if (cleaned.startsWith('+')) return true;
  
  // Códigos de país comuns (2-3 dígitos no início)
  // Ex: 55 (Brasil), 351 (Portugal), 1 (EUA/Canadá), 51 (Peru)
  const digitsOnly = cleaned.replace(/\D/g, '');
  
  // Se tem mais de 11 dígitos, provavelmente é internacional
  if (digitsOnly.length > 11) return true;
  
  // Se tem exatamente 11 ou menos, provavelmente é BR sem código de país
  return false;
}

/**
 * Formata telefone brasileiro no padrão (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX
 */
export function formatPhoneBR(phone: string): string {
  if (!phone) return '—';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned) return phone;
  
  // Celular: (XX) 9XXXX-XXXX (11 dígitos)
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } 
  // Fixo: (XX) XXXX-XXXX (10 dígitos)
  else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } 
  // Sem DDD, celular (9 dígitos)
  else if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } 
  // Sem DDD, fixo (8 dígitos)
  else if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  // Não se encaixa em nenhum padrão, retorna original
  return phone;
}

/**
 * Formata telefone internacional no padrão +CC (DD) XXXXX-XXXX
 * Exemplos:
 * - +51 939 964 833 → +51 939 964 833 (mantém espaços)
 * - +351 912 345 678 → +351 912 345 678
 * - +1 (555) 123-4567 → +1 555 123-4567
 */
export function formatPhoneInternational(phone: string): string {
  if (!phone) return '—';
  
  let cleaned = phone.trim();
  
  // Se não tem +, adiciona (assumindo que é internacional)
  if (!cleaned.startsWith('+')) {
    const digitsOnly = cleaned.replace(/\D/g, '');
    
    // Detectar código de país comum
    // 55 = Brasil, 1 = USA/Canadá, 351 = Portugal, 51 = Peru, 52 = México, etc
    const commonCodes = ['1', '55', '51', '52', '54', '351', '353'];
    
    for (const code of commonCodes) {
      if (digitsOnly.startsWith(code)) {
        // Se é Brasil (55), não é internacional (já deveria estar sem código)
        if (code === '55') {
          // Remove o 55 e formata como BR
          return formatPhoneBR(digitsOnly.slice(2));
        }
        
        // Para outros países, adiciona +
        cleaned = `+${digitsOnly}`;
        break;
      }
    }
    
    // Se não encontrou código conhecido, assume que não tem código
    if (!cleaned.startsWith('+')) {
      cleaned = `+${digitsOnly}`;
    }
  }
  
  // Remove todos os caracteres exceto dígitos, espaços, +, parênteses e hífen
  cleaned = cleaned.replace(/[^\d\s+()-]/g, '');
  
  // Normaliza espaços múltiplos
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned;
}

/**
 * Formata telefone de forma inteligente:
 * - Se for internacional, usa formatPhoneInternational
 * - Se for brasileiro, usa formatPhoneBR
 * 
 * Esta é a função PRINCIPAL que deve ser usada em toda a aplicação
 */
export function formatPhoneSmart(phone: string | undefined | null): string {
  if (!phone) return '—';
  
  const isIntl = isInternationalPhone(phone);
  
  if (isIntl) {
    return formatPhoneInternational(phone);
  } else {
    return formatPhoneBR(phone);
  }
}

/**
 * Aplica máscara de telefone brasileiro enquanto digita (para inputs)
 */
export function applyPhoneMaskBR(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }
}

/**
 * Remove formatação de telefone, mantendo apenas dígitos e +
 */
export function unformatPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}
