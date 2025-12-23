# Componentes Compartilhados

Biblioteca de componentes reutilizáveis para o CentralCasape2.

## Sistema de Modais (3 componentes)

### BaseModal
Modal básico com backdrop e comportamento de fechamento.
```tsx
import { BaseModal } from './shared';

<BaseModal isOpen={true} onClose={() => {}}>
  Conteúdo do modal
</BaseModal>
```

### Modal
Modal com header, footer e tamanhos configuráveis.
```tsx
import { Modal } from './shared';

<Modal
  isOpen={true}
  onClose={() => {}}
  title="Título"
  size="md"
  footer={<button>Salvar</button>}
>
  Conteúdo
</Modal>
```

### ModalLayout
Modal com sistema de tabs.
```tsx
import { ModalLayout } from './shared';

<ModalLayout
  isOpen={true}
  onClose={() => {}}
  title="Configurações"
  tabs={[
    { name: 'general', label: 'Geral' },
    { name: 'advanced', label: 'Avançado' }
  ]}
  activeTab="general"
  onTabChange={(tab) => {}}
>
  Conteúdo da tab
</ModalLayout>
```

## Sistema de Formulários (4 componentes)

### FormInput
```tsx
<FormInput
  label="Nome"
  value={name}
  onChange={setName}
  required
  icon={<User />}
/>
```

### FormSelect
```tsx
<FormSelect
  label="Categoria"
  value={category}
  onChange={setCategory}
  options={[
    { value: '1', label: 'Opção 1' },
    { value: '2', label: 'Opção 2' }
  ]}
/>
```

### FormTextarea
```tsx
<FormTextarea
  label="Descrição"
  value={description}
  onChange={setDescription}
  maxLength={500}
  showCounter
/>
```

### FormCheckbox
```tsx
<FormCheckbox
  label="Aceitar termos"
  checked={accepted}
  onChange={setAccepted}
  description="Li e concordo com os termos"
/>
```

## Sistema de Tabelas (2 componentes)

### DataTable
Tabela genérica com TypeScript generics.
```tsx
<DataTable
  data={items}
  columns={[
    { key: 'name', label: 'Nome' },
    { key: 'category', label: 'Categoria' },
    { key: 'stock', label: 'Estoque', render: (val) => val.Central }
  ]}
  actions={(item) => (
    <>
      <button onClick={() => edit(item)}>Editar</button>
      <DeleteButton onDelete={() => remove(item)} />
    </>
  )}
/>
```

### PaginationControls
```tsx
<PaginationControls
  currentPage={1}
  totalPages={10}
  totalItems={100}
  itemsPerPage={10}
  onPageChange={setPage}
/>
```

## UI Primitives (10 componentes)

### StatusBadge
```tsx
<StatusBadge status="Ativo" variant="success" />
```

### Badge
```tsx
<Badge variant="primary">Novo</Badge>
```

### Card
```tsx
<Card title="Título" padding="md" shadow border>
  Conteúdo do card
</Card>
```

### IconButton
```tsx
<IconButton
  icon={<Plus />}
  onClick={() => {}}
  label="Adicionar"
  variant="primary"
/>
```

### DeleteButton
```tsx
<DeleteButton
  onDelete={() => {}}
  confirmMessage="Excluir item?"
/>
```

### SearchInput
```tsx
<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Buscar..."
/>
```

### RatingStars
```tsx
<RatingStars
  rating={4}
  onChange={setRating}
/>
```

### WeekdaySelector
```tsx
<WeekdaySelector
  selectedDays={['seg', 'qua', 'sex']}
  onChange={setDays}
/>
```

### EmptyState
```tsx
<EmptyState
  icon={<Inbox />}
  title="Nenhum item encontrado"
  description="Adicione um novo item para começar"
  action={<button>Adicionar</button>}
/>
```

### LoadingSpinner
```tsx
<LoadingSpinner size={24} text="Carregando..." />
```

## Uso

```tsx
// Import individual
import Modal from './components/shared/Modal';

// Import via index (recomendado)
import { Modal, DataTable, FormInput } from './components/shared';
```

## Testes

Todos os componentes possuem testes completos em arquivos `.test.tsx`.

**Coverage**: 36.9% (47 testes)

Execute: `npm test -- components/shared/`
