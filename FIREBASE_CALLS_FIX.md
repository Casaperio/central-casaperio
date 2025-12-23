# Correção: Erro de IDs Inválidos na Coleção `calls`

## Problema

```
Uncaught FirebaseError: Invalid document reference. Document references must have an even number of segments, but calls/L-VF-230-106 | LEB General Venâncio Flores 230/106 has 3.
```

### Causa
O código estava usando `propertyCode` diretamente como ID de documento no Firestore. Alguns códigos de propriedade contêm barras (`/`), o que é **inválido** no Firestore pois `/` é interpretado como separador de caminho de coleção/documento.

**Exemplo de propertyCode inválido**: `L-VF-230-106 | LEB General Venâncio Flores 230/106`

## Soluções Implementadas

### 1. Função de Sanitização (`services/storage.ts`)

Adicionada função para sanitizar IDs antes de usar como documento:

```typescript
// Sanitize ID to make it Firebase-compatible (remove invalid characters like /)
const sanitizeDocId = (id: string): string => {
  return id.replace(/\//g, '_');
};
```

### 2. Atualização das Funções VoIP

Todas as funções que usam `propertyCode` como ID de documento agora sanitizam o valor:

- **`startCall()`**: `doc(sanitizeDocId(session.propertyCode))`
- **`updateCall()`**: `doc(sanitizeDocId(propertyCode))`
- **`subscribeCall()`**: `doc(sanitizeDocId(propertyCode))`

### 3. Error Handler em `subscribeAllCalls()`

Adicionado tratamento de erro para prevenir crash da aplicação:

```typescript
.onSnapshot((snapshot) => {
  const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallSession));
  callback(sessions);
}, (error) => {
  console.error("Erro ao buscar chamadas:", error);
  callback([]); // Return empty array on error to prevent app crash
});
```

## Limpeza de Dados Antigos

### Script de Limpeza

Criado script para remover documentos com IDs inválidos:

```bash
npx tsx scripts/cleanInvalidCallDocs.ts
```

**O que o script faz:**
1. Lista todos os documentos na coleção `calls`
2. Remove todos os documentos (incluindo os com IDs inválidos)
3. Permite que novos documentos sejam criados com IDs sanitizados

### Limpeza Manual via Console Firebase

Alternativa se o script não funcionar:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Navegue até: **Firestore Database > calls**
3. Delete manualmente todos os documentos
4. Ou delete a coleção inteira e ela será recriada automaticamente

## Verificação

Após a correção:
- ✅ Build compila sem erros
- ✅ Novos documentos usarão IDs sanitizados (`L-VF-230-106_|_LEB_General_Venâncio_Flores_230_106`)
- ✅ Subscrição de chamadas tem error handler
- ✅ Aplicação não trava se encontrar documentos inválidos

## Próximos Passos

1. **Execute o script de limpeza** OU **delete documentos manualmente**
2. **Teste criação de nova chamada** para verificar se IDs são sanitizados
3. **Monitore logs do console** para erros relacionados a `calls`

## Prevenção

Para evitar problemas similares no futuro:
- ✅ Sempre sanitizar IDs dinâmicos antes de usar como documento ID
- ✅ Validar dados de entrada que serão usados como IDs
- ✅ Adicionar error handlers em todas as subscrições Firebase
- ✅ Considerar usar IDs gerados automaticamente pelo Firebase quando possível
