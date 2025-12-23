# Guia de Refatoração do App.tsx

## Componentes Criados

### ✅ Componentes de Layout

#### 1. NotificationCenter
**Localização**: `components/layout/NotificationCenter.tsx`
**Responsabilidade**: Centro de notificações com dropdown
**Props**:
```typescript
{
  notifications: SystemNotification[];
  showNotifications: boolean;
  onToggle: () => void;
  onMarkAllRead: () => void;
  onClear: () => void;
}
```

#### 2. AppSidebar
**Localização**: `components/layout/AppSidebar.tsx`
**Responsabilidade**: Navegação lateral completa
**Props**:
```typescript
{
  currentUser: User;
  activeModule: AppModule | null;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  isSystemRefreshing: boolean;
  lastSystemRefresh: Date | null;
  onModuleChange: (module: AppModule, view: ViewMode) => void;
  onViewModeChange: (view: ViewMode) => void;
  onToggleSidebar: () => void;
  onCloseMobileMenu: () => void;
  onGlobalRefresh: () => void;
  onLogout: () => void;
}
```

### ✅ Hooks Personalizados

#### 1. useNotifications
**Localização**: `hooks/app/useNotifications.ts`
**Responsabilidade**: Gerenciamento de estado de notificações
**Retorna**:
```typescript
{
  notifications: SystemNotification[];
  showNotifications: boolean;
  addNotification: (title, message, type) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  toggleNotifications: () => void;
}
```

## Como Integrar os Componentes

### Passo 1: Atualizar Imports no App.tsx

No topo do App.tsx, adicione:

```typescript
// Layout Components
import AppSidebar from './components/layout/AppSidebar';
import NotificationCenter from './components/layout/NotificationCenter';

// Hooks
import { useNotifications } from './hooks/app/useNotifications';
```

### Passo 2: Substituir o estado de notificações

**Antes:**
```typescript
const [notifications, setNotifications] = useState<SystemNotification[]>([]);
const [showNotifications, setShowNotifications] = useState(false);

const addNotification = (title: string, message: string, type = 'info') => {
  setNotifications(prev => [/* ... */]);
};
// ... outras funções
```

**Depois:**
```typescript
const {
  notifications,
  showNotifications,
  addNotification,
  markAllRead,
  clearNotifications,
  toggleNotifications,
} = useNotifications();
```

### Passo 3: Substituir NavigationContent

**Antes (linhas 1002-1179):**
```typescript
const NavigationContent = () => (
  // ... 177 linhas de código ...
);
```

**Depois:**
Remover completamente o componente `NavigationContent`.

### Passo 4: Atualizar o render da Sidebar

**Antes (linhas 1190-1201):**
```typescript
<aside className="...">
  <div className="absolute top-2 right-2">
    <button onClick={() => setMobileMenuOpen(false)}>
      <X size={20} />
    </button>
  </div>
  <NavigationContent />
</aside>

<aside className="...">
  <NavigationContent />
</aside>
```

**Depois:**
```typescript
{/* Mobile Sidebar */}
<aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
  <div className="absolute top-2 right-2">
    <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100">
      <X size={20} />
    </button>
  </div>
  <AppSidebar
    currentUser={currentUser}
    activeModule={activeModule}
    viewMode={viewMode}
    sidebarOpen={sidebarOpen}
    mobileMenuOpen={mobileMenuOpen}
    isSystemRefreshing={isSystemRefreshing}
    lastSystemRefresh={lastSystemRefresh}
    onModuleChange={(module, view) => {
      setActiveModule(module);
      setViewMode(view);
    }}
    onViewModeChange={setViewMode}
    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
    onCloseMobileMenu={() => setMobileMenuOpen(false)}
    onGlobalRefresh={handleGlobalRefresh}
    onLogout={handleLogout}
  />
</aside>

{/* Desktop Sidebar */}
<aside className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 flex-col transition-all duration-300 z-20 shadow-sm relative`}>
  <AppSidebar
    currentUser={currentUser}
    activeModule={activeModule}
    viewMode={viewMode}
    sidebarOpen={sidebarOpen}
    mobileMenuOpen={mobileMenuOpen}
    isSystemRefreshing={isSystemRefreshing}
    lastSystemRefresh={lastSystemRefresh}
    onModuleChange={(module, view) => {
      setActiveModule(module);
      setViewMode(view);
    }}
    onViewModeChange={setViewMode}
    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
    onCloseMobileMenu={() => setMobileMenuOpen(false)}
    onGlobalRefresh={handleGlobalRefresh}
    onLogout={handleLogout}
  />
</aside>
```

### Passo 5: Atualizar NotificationCenter no Header

**Antes (linhas 1247-1290):**
```typescript
{/* Notification Center */}
<div className="relative">
  <button onClick={() => setShowNotifications(!showNotifications)} /* ... */>
    <Bell size={20} />
    {/* ... */}
  </button>
  {showNotifications && (
    <div /* ... */>
      {/* ... muitas linhas ... */}
    </div>
  )}
</div>
```

**Depois:**
```typescript
<NotificationCenter
  notifications={notifications}
  showNotifications={showNotifications}
  onToggle={toggleNotifications}
  onMarkAllRead={markAllRead}
  onClear={clearNotifications}
/>
```

### Passo 6: Remover código antigo

Após integrar os novos componentes, remova:
- Interface `SystemNotification` (linha 77-83) - agora exportada de NotificationCenter
- Funções `addNotification`, `markAllRead`, `clearNotifications` (linhas 311-330)
- Componente `NavigationContent` completo (linhas 1002-1179)

## Impacto da Refatoração

### Redução de Código

| Componente | Antes | Depois | Redução |
|------------|-------|--------|---------|
| App.tsx | ~1706 linhas | ~1450 linhas | ~256 linhas (-15%) |
| NotificationCenter | - | 95 linhas | Novo componente |
| AppSidebar | - | 270 linhas | Novo componente |
| useNotifications | - | 45 linhas | Novo hook |

### Benefícios

1. **Manutenibilidade**: Componentes isolados são mais fáceis de manter
2. **Testabilidade**: Cada componente pode ser testado independentemente
3. **Reusabilidade**: AppSidebar e NotificationCenter podem ser reutilizados
4. **Organização**: Código organizado por responsabilidade

## Próximos Passos de Refatoração

### Prioridade Alta
1. **Extrair AppHeader** - Header completo (~100 linhas)
2. **Extrair MaintenanceModule** - Renderização de tickets (~400 linhas)
3. **Extrair AppModals** - Todos os modais (~300 linhas)

### Prioridade Média
4. **Criar useDataSubscriptions** - Centralizar todos os useEffects de Firebase
5. **Criar useFilteredData** - Lógica de filtragem e agrupamento
6. **Extrair ReservationsModule** - Renderização de reservas

### Prioridade Baixa
7. **Criar useCallHandling** - Lógica de chamadas WebRTC
8. **Criar useKioskMode** - Lógica do modo tablet
9. **Extrair BoardsModule** - Renderização de painéis

## Estrutura de Pastas Recomendada

```
components/
├── layout/
│   ├── AppSidebar.tsx ✅
│   ├── AppHeader.tsx (próximo)
│   └── NotificationCenter.tsx ✅
├── modules/
│   ├── MaintenanceModule.tsx (próximo)
│   ├── ReservationsModule.tsx
│   └── GuestModule.tsx
└── modals/
    └── AppModals.tsx (próximo)

hooks/
└── app/
    ├── useNotifications.ts ✅
    ├── useDataSubscriptions.ts (próximo)
    ├── useFilteredData.ts
    └── useCallHandling.ts
```

## Dicas de Integração

1. **Teste incrementalmente**: Integre um componente por vez e teste
2. **Mantenha tipos consistentes**: Use os tipos existentes de `types.ts`
3. **Preserve funcionalidade**: Não altere a lógica de negócio, apenas reorganize
4. **Use callbacks**: Passe funções via props para manter o controle no App.tsx
5. **Documente mudanças**: Atualize comentários ao refatorar

## Testando a Refatoração

Após cada integração, execute:

```bash
# Verificar erros de tipo
npm run build

# Testar em desenvolvimento
npm run dev
```

Verifique:
- [ ] Navegação funciona corretamente
- [ ] Notificações aparecem e podem ser marcadas como lidas
- [ ] Sidebar colapsa/expande no desktop
- [ ] Menu mobile abre/fecha corretamente
- [ ] Logout funciona
- [ ] Mudança de módulos funciona
- [ ] Atualização de dados funciona
