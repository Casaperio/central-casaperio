# Task 6: Guest & CRM - Telefone/Email + Telefones Extras ✅

**Status:** Implementado  
**Data:** 31 de Janeiro de 2026  
**Módulo:** Guest & CRM - Modal de Detalhes da Reserva

## 📋 Objetivo

Exibir **email e telefone base** do hóspede no modal Guest & CRM e permitir **gerenciamento de telefones adicionais** com persistência em banco de dados complementar (Firestore), garantindo que os dados sejam compartilhados entre todas as reservas do mesmo hóspede.

## 🎯 Funcionalidades Implementadas

### 1. **Exibição de Dados Base**
- ✅ Email do hóspede (campo `guestEmail` na Reservation)
- ✅ Telefone principal (campo `guestPhone` na Reservation)
- ✅ Visual clean com ícones (Mail, Phone)
- ✅ Placeholder "Não informado" quando não há dados

### 2. **Gerenciamento de Telefones Extras**
- ✅ Lista de telefones adicionais por hóspede
- ✅ Adicionar novo telefone com validação (mínimo 8 dígitos)
- ✅ Remover telefone da lista
- ✅ Contador de telefones cadastrados
- ✅ Evita duplicatas na lista

### 3. **Máscara e Validação**
- ✅ Máscara automática ao digitar: `(XX) XXXXX-XXXX`
- ✅ Formatação para exibição de telefones salvos
- ✅ Validação mínima: 8 dígitos numéricos
- ✅ Máximo 15 caracteres (com máscara)

### 4. **Persistência Inteligente**
- ✅ Dados salvos no Firestore: coleção `guest_contact_data`
- ✅ Chave estável: `guestKey` (nome normalizado)
- ✅ Debounce de 500ms para evitar spam de gravações
- ✅ Auto-save ao adicionar/remover telefone
- ✅ Indicador visual de salvamento

### 5. **UX/UI**
- ✅ Seção dedicada com cor roxa (destaque visual)
- ✅ Loading states durante carregamento
- ✅ Feedback visual "Salvando..." / "✓ Salvo"
- ✅ Enter para adicionar telefone (atalho)
- ✅ Nota explicativa sobre compartilhamento entre reservas

## 🔧 Implementação Técnica

### Arquivos Modificados

#### 1. `types.ts`
```typescript
// Adicionado na interface Reservation
export interface Reservation {
  // ... campos existentes
  guestEmail?: string; // Task 6: Email do hóspede (fonte base)
  guestPhone?: string; // Task 6: Telefone do hóspede (fonte base)
  // ...
}

// Nova interface para telefones extras
export interface GuestContactData {
  id: string;
  guestKey: string; // Nome normalizado usado como chave
  guestName: string; // Nome original do hóspede
  extraPhones: string[]; // Telefones adicionais
  updatedAt: number;
  updatedBy: string;
}
```

#### 2. `services/storage.ts`
```typescript
// Nova coleção no Firestore
const COLLECTIONS = {
  // ... coleções existentes
  GUEST_CONTACT_DATA: 'guest_contact_data',
  // ...
};

// Novo serviço
guestContactData: {
  get: async (guestKey: string): Promise<GuestContactData | null> => {
    ensureDb();
    const docRef = db.collection(COLLECTIONS.GUEST_CONTACT_DATA)
      .doc(sanitizeDocId(guestKey));
    const doc = await docRef.get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as GuestContactData;
    }
    return null;
  },

  set: async (contactData: Omit<GuestContactData, 'id'>): Promise<void> => {
    ensureDb();
    const { guestKey, ...data } = contactData;
    const docId = sanitizeDocId(guestKey);
    await db.collection(COLLECTIONS.GUEST_CONTACT_DATA)
      .doc(docId)
      .set(cleanData({ guestKey, ...data }), { merge: true });
  }
}
```

#### 3. `components/ReservationDetailModal.tsx`

**Estados Adicionados:**
```typescript
const [extraPhones, setExtraPhones] = useState<string[]>([]);
const [newPhone, setNewPhone] = useState('');
const [loadingContactData, setLoadingContactData] = useState(true);
const [savingContactData, setSavingContactData] = useState(false);
const contactDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
```

**Máscara de Telefone:**
```typescript
const applyPhoneMask = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 2) return cleaned;
  else if (cleaned.length <= 6) 
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  else if (cleaned.length <= 10) 
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  else 
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
};

const formatPhoneBR = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) 
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  else if (cleaned.length === 10) 
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  // ... fallbacks
};
```

**Carregamento de Dados:**
```typescript
useEffect(() => {
  const loadContactData = async () => {
    const guestKey = normalizeGuestName(reservation.guestName);
    try {
      const contactData = await storageService.guestContactData.get(guestKey);
      if (contactData && contactData.extraPhones) {
        setExtraPhones(contactData.extraPhones);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de contato:', error);
    } finally {
      setLoadingContactData(false);
    }
  };

  loadContactData();
}, [reservation.guestName]);
```

**Salvamento com Debounce:**
```typescript
const saveContactData = useCallback(async (phones: string[]) => {
  const guestKey = normalizeGuestName(reservation.guestName);
  setSavingContactData(true);

  try {
    await storageService.guestContactData.set({
      guestKey,
      guestName: reservation.guestName,
      extraPhones: phones,
      updatedAt: Date.now(),
      updatedBy: currentUser.name
    });
  } catch (error) {
    console.error('Erro ao salvar dados de contato:', error);
  } finally {
    setSavingContactData(false);
  }
}, [reservation.guestName, currentUser.name]);
```

**Handlers:**
```typescript
const handleAddPhone = useCallback(() => {
  const cleaned = newPhone.trim();
  if (!cleaned) return;

  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 8) {
    alert('Telefone inválido. Mínimo 8 dígitos.');
    return;
  }

  if (extraPhones.includes(cleaned)) {
    alert('Este telefone já está na lista.');
    return;
  }

  const updated = [...extraPhones, cleaned];
  setExtraPhones(updated);
  setNewPhone('');

  // Salvar com debounce
  if (contactDebounceTimerRef.current) {
    clearTimeout(contactDebounceTimerRef.current);
  }
  contactDebounceTimerRef.current = setTimeout(() => {
    saveContactData(updated);
  }, 500);
}, [newPhone, extraPhones, saveContactData]);

const handleRemovePhone = useCallback((phone: string) => {
  const updated = extraPhones.filter(p => p !== phone);
  setExtraPhones(updated);

  // Salvar com debounce
  if (contactDebounceTimerRef.current) {
    clearTimeout(contactDebounceTimerRef.current);
  }
  contactDebounceTimerRef.current = setTimeout(() => {
    saveContactData(updated);
  }, 500);
}, [extraPhones, saveContactData]);
```

**UI Adicionada:**
```tsx
{/* Task 6: Guest Contact Data */}
<div className="bg-purple-50 rounded-none p-5 border border-purple-100">
  <div className="flex items-center gap-2 mb-4">
    <Phone size={18} className="text-purple-700" />
    <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">
      Contato do Hóspede
    </h3>
    {savingContactData && <span className="text-xs text-purple-600 ml-auto">Salvando...</span>}
    {!savingContactData && extraPhones.length > 0 && <span className="text-xs text-green-600 ml-auto">✓ Salvo</span>}
  </div>

  {/* Email & Phone Base */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div className="bg-white p-3 rounded border border-purple-200">
      <div className="flex items-center gap-2 mb-1">
        <Mail size={14} className="text-gray-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase">Email</span>
      </div>
      <p className="text-sm text-gray-900 break-all">
        {reservation.guestEmail || <span className="text-gray-400 italic">Não informado</span>}
      </p>
    </div>

    <div className="bg-white p-3 rounded border border-purple-200">
      <div className="flex items-center gap-2 mb-1">
        <Phone size={14} className="text-gray-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase">Telefone Principal</span>
      </div>
      <p className="text-sm text-gray-900">
        {reservation.guestPhone ? formatPhoneBR(reservation.guestPhone) : 
          <span className="text-gray-400 italic">Não informado</span>}
      </p>
    </div>
  </div>

  {/* Telefones Extras */}
  <div className="bg-white p-3 rounded border border-purple-200">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-purple-800 uppercase">
        Telefones Adicionais
      </span>
      <span className="text-xs text-gray-500">
        {extraPhones.length} cadastrado{extraPhones.length !== 1 ? 's' : ''}
      </span>
    </div>

    {/* Lista de telefones */}
    {extraPhones.length > 0 && (
      <div className="space-y-2 mb-3">
        {extraPhones.map((phone, idx) => (
          <div key={idx} className="flex items-center justify-between bg-purple-50 p-2 rounded">
            <span className="text-sm text-gray-900">{formatPhoneBR(phone)}</span>
            <button
              onClick={() => handleRemovePhone(phone)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remover telefone"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    )}

    {/* Form para adicionar */}
    <div className="flex gap-2">
      <input
        type="text"
        value={newPhone}
        onChange={(e) => setNewPhone(applyPhoneMask(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddPhone();
          }
        }}
        className="flex-1 text-sm p-2 rounded border border-purple-200 
                   focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder="(11) 98765-4321"
        maxLength={15}
      />
      <button
        onClick={handleAddPhone}
        className="bg-purple-600 text-white px-4 py-2 rounded 
                   hover:bg-purple-700 transition-colors flex items-center gap-1"
      >
        <Plus size={16} />
        <span className="text-sm font-medium">Adicionar</span>
      </button>
    </div>
  </div>

  <p className="text-xs text-purple-700">
    💡 Nota: Telefones adicionais são compartilhados entre todas as reservas deste hóspede.
  </p>
</div>
```

## 📊 Estrutura de Dados

### Firestore Collection: `guest_contact_data`

**Document ID:** Nome normalizado do hóspede (sem acentos, lowercase, espaços únicos)

**Schema:**
```json
{
  "id": "carolina-chaves-pinheiro",
  "guestKey": "carolina chaves pinheiro",
  "guestName": "Carolina Chaves Pinheiro",
  "extraPhones": [
    "(11) 98765-4321",
    "(21) 3456-7890"
  ],
  "updatedAt": 1738368000000,
  "updatedBy": "Admin User"
}
```

### Chave Estável (`guestKey`)

**Algoritmo de Normalização:**
```typescript
const normalizeGuestName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' '); // Colapsa múltiplos espaços
};
```

**Exemplos:**
- `"Carolina Chaves Pinheiro"` → `"carolina chaves pinheiro"`
- `"José Maria"` → `"jose maria"`
- `"Ana  Paula"` (duplo espaço) → `"ana paula"`

## 🎨 Design Decisions

### 1. **Por que não vincular por email?**
- Email pode não estar disponível em todas as reservas
- Hóspede pode usar emails diferentes
- Nome é mais estável e sempre presente

### 2. **Por que Firestore e não duplicar na Reservation?**
- Dados complementares não devem "inflar" reservas
- Fonte base (Stays API) não deve ser alterada
- Permite compartilhamento entre reservas do mesmo hóspede
- Mais fácil de gerenciar e atualizar

### 3. **Por que array em vez de múltiplos campos?**
- Flexibilidade: número variável de telefones
- Fácil adicionar/remover
- Simples de iterar e exibir

### 4. **Por que debounce de 500ms?**
- Evita spam de gravações no Firestore
- Usuário pode adicionar/remover rapidamente
- Mais econômico (menos writes)

### 5. **Por que validação mínima (8 dígitos)?**
- Suporta telefones fixos (8 dígitos) e celulares (9 dígitos)
- Suporta com ou sem DDD
- Evita números claramente inválidos
- Não bloqueia formatos internacionais

## 🧪 Cenários de Teste

### ✅ Testes Manuais Recomendados

1. **Exibição de Dados Base:**
   - [ ] Abrir reserva com `guestEmail` e `guestPhone` preenchidos
   - [ ] Verificar exibição formatada
   - [ ] Abrir reserva sem email/phone
   - [ ] Verificar placeholder "Não informado"

2. **Adicionar Telefone:**
   - [ ] Digitar telefone válido (11) 98765-4321
   - [ ] Verificar máscara aplicada automaticamente
   - [ ] Clicar "Adicionar" ou pressionar Enter
   - [ ] Verificar telefone na lista formatado
   - [ ] Verificar indicador "✓ Salvo"

3. **Validações:**
   - [ ] Tentar adicionar telefone com menos de 8 dígitos
   - [ ] Verificar alerta "Telefone inválido"
   - [ ] Adicionar telefone duplicado
   - [ ] Verificar alerta "já está na lista"
   - [ ] Tentar adicionar campo vazio
   - [ ] Verificar que nada acontece

4. **Remover Telefone:**
   - [ ] Clicar no X de um telefone
   - [ ] Verificar remoção da lista
   - [ ] Verificar indicador "Salvando..." → "✓ Salvo"

5. **Persistência:**
   - [ ] Adicionar 2-3 telefones
   - [ ] Fechar modal
   - [ ] Reabrir mesmo hóspede
   - [ ] Verificar telefones ainda presentes
   - [ ] Recarregar página (F5)
   - [ ] Reabrir reserva
   - [ ] Verificar telefones persistidos

6. **Compartilhamento entre Reservas:**
   - [ ] Adicionar telefones na reserva A do hóspede "João Silva"
   - [ ] Abrir reserva B do mesmo hóspede "João Silva"
   - [ ] Verificar mesmos telefones presentes
   - [ ] Adicionar telefone na reserva B
   - [ ] Voltar para reserva A
   - [ ] Verificar novo telefone também aparece

7. **Máscara e Formatação:**
   - [ ] Digitar: 11 → Ver: `11`
   - [ ] Digitar: 1198 → Ver: `(11) 98`
   - [ ] Digitar: 11987654 → Ver: `(11) 9876-54`
   - [ ] Digitar: 11987654321 → Ver: `(11) 98765-4321`
   - [ ] Telefone salvo aparece formatado na lista

## 📝 Notas de Desenvolvimento

### 1. **Compatibilidade com Dados Futuros**
Se a API externa (Stays) começar a fornecer `guestEmail` e `guestPhone` na resposta das reservas, esses campos aparecerão automaticamente no modal. Nenhuma mudança de código necessária.

### 2. **Não Quebra Reservas Existentes**
- Campos `guestEmail` e `guestPhone` são opcionais (`?`)
- Reservas antigas sem esses campos continuam funcionando
- Loading graceful: mostra "Não informado"

### 3. **Estratégia de Normalização Consistente**
- Mesma função `normalizeGuestName` usada para `guestNotes` e `guestContactData`
- Garante que um hóspede tenha UMA ÚNICA chave em todos os sistemas
- Evita duplicatas por variação de escrita

### 4. **Performance**
- Debounce evita múltiplas gravações
- Loading states evitam "flicker" de UI
- Firestore usa merge para atualizar apenas campos alterados

### 5. **Segurança e Auditoria**
- `updatedBy` rastreia quem fez a última alteração
- `updatedAt` rastreia quando foi alterado
- Dados vinculados ao hóspede, não à reserva específica

## 🚀 Melhorias Futuras (Opcional)

### Não Prioritárias
- [ ] Validação internacional de telefones (libphonenumber)
- [ ] Detectar país automaticamente pelo DDD
- [ ] Histórico de alterações de telefones
- [ ] Integração com WhatsApp (link para chat)
- [ ] Botão "Copiar telefone" ao lado de cada número
- [ ] Verificação de telefone duplicado entre hóspedes diferentes (alertar possível duplicata de cadastro)
- [ ] Campo "Tipo" para cada telefone (Celular, Fixo, WhatsApp Business, etc.)

## ✅ Checklist de Conclusão

- [x] Interface `GuestContactData` criada
- [x] Serviço `guestContactData` implementado em storage.ts
- [x] Campos `guestEmail` e `guestPhone` adicionados na Reservation
- [x] Estados de loading/saving implementados
- [x] Máscara de telefone brasileiro funcionando
- [x] Validação mínima (8 dígitos) implementada
- [x] Debounce de salvamento implementado
- [x] UI com cores distintas (roxo) implementada
- [x] Feedback visual de salvamento implementado
- [x] Evita duplicatas de telefones
- [x] Loading states durante carregamento inicial
- [x] Cleanup de timers de debounce
- [x] Zero erros de compilação
- [x] Documentação completa criada

---

**Task 6 Completa! 🎉**

O modal Guest & CRM agora exibe email/telefone base e permite gerenciar telefones extras de forma persistente e compartilhada entre todas as reservas do mesmo hóspede.
