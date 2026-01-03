# Loop Community - Architecture & Integration Map

**Last Updated:** January 4, 2026  
**Version:** 1.0  
**Purpose:** Complete system architecture and integration mapping

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Component Integration Map](#component-integration-map)
5. [Service Dependencies](#service-dependencies)
6. [Storage Architecture](#storage-architecture)
7. [State Management](#state-management)
8. [External Integrations](#external-integrations)
9. [Event Flow](#event-flow)
10. [Critical Paths](#critical-paths)

---

## 🏗️ System Overview

Loop Community is a React-based progressive web app with mobile support (Capacitor) that provides an intelligent todo management system with AI-powered features, behavioral learning, and offline capabilities.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  React Components (App.tsx, TodoCard, Modals, Features)        │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                            │
│  Zustand Store (todoStore.ts) + React Hooks (useTodoLogic)     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC                              │
│  35+ Services (notifications, AI, storage, analytics, etc.)     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                               │
│  IndexedDB + localStorage + Cross-tab Sync + Health Monitor     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│  Google Gemini AI, Capacitor Plugins, Browser APIs              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Architecture Layers

### Layer 1: Presentation (UI Components)

**Location:** `/components/`

```
components/
├── layout/              # App structure
│   ├── Header.tsx      → Top navigation, search, settings
│   └── Footer.tsx      → Bottom actions, stats
├── features/           # Feature-specific components
│   └── todo/
│       ├── TodoInput.tsx    → Add/edit todos
│       ├── TodoBundle.tsx   → Template bundles
│       └── SmartCategorization.tsx
├── modals/             # Overlay dialogs
│   ├── ApiKeyModal.tsx
│   ├── SettingsModal.tsx
│   ├── LibraryModal.tsx
│   ├── ReviewModal.tsx
│   └── NeuralNudgeDashboard.tsx
├── ui/                 # Reusable UI primitives
│   └── HelpTooltip.tsx
├── TodoCard.tsx        # Individual todo display
├── Onboarding.tsx      # First-time user experience
└── ErrorBoundary.tsx   # Error catching wrapper
```

**Key Integrations:**
- Imports from `hooks/useTodoLogic` (primary data interface)
- Calls `services/notificationService` for haptics/nudges
- Uses `stores/todoStore` for state (via hooks)
- Integrates `services/speechService` for voice input

---

### Layer 2: State Management

**Location:** `/stores/` + `/hooks/`

#### **Zustand Store (`todoStore.ts`)**

```typescript
Central State Container:
├── todos: Todo[]              # All user todos
├── templates: Template[]      # Saved templates
├── addTodo()                 # Add new todo
├── deleteTodo()              # Remove todo
├── updateTodo()              # Modify todo
├── loadTodos()               # Bulk load from storage
└── [6 more template methods]
```

**Subscribers:**
- `useTodoLogic` (primary consumer)
- `App.tsx` (direct access for some features)
- Test runners (phase3-6)

#### **Custom Hooks**

```
hooks/
├── useTodoLogic.ts      # 🔥 CORE LOGIC HUB (481 lines)
│   ├── State: input, voice, AI, filters, grouping
│   ├── Effects: load/save, sync, voice listening
│   ├── Handlers: add, delete, update, voice commands
│   └── Returns: 30+ functions & state values
├── useActivityTracker.ts  # User behavior tracking
└── useNetworkStatus.ts    # Online/offline detection
```

**Integration Pattern:**

```
App.tsx
  ↓ imports
useTodoLogic()
  ↓ uses
todoStore (Zustand)
  ↓ persists via
offlineStorageService
  ↓ stores in
localStorage + IndexedDB
```

---

### Layer 3: Business Logic (Services)

**Location:** `/services/` (35 files, 9,303 lines)

#### **Core Services Matrix**

| Service | Purpose | Dependencies | Integrates With |
|---------|---------|--------------|-----------------|
| **notificationService.ts** | Push notifications, haptics, neural nudges | Capacitor plugins, enhancedLearningEngine | App.tsx, TodoCard, useTodoLogic |
| **geminiService.ts** | Google Gemini AI integration | apiKeyService, rateLimitService | useTodoLogic (templates, categorization) |
| **offlineStorageService.ts** | localStorage CRUD operations | storageQuota, validators, debounce | useTodoLogic, indexedDBService |
| **indexedDBService.ts** | Async IndexedDB operations | offlineStorageService (fallback) | dataMigrationService, backupService |
| **speechService.ts** | Voice recognition (native + web) | Capacitor SpeechRecognition | useTodoLogic, voiceCommandService |
| **voiceCommandService.ts** | Parse voice → actions | taskCategorizationService | useTodoLogic |
| **enhancedLearningEngine.ts** | ML predictions, personalization | behavioralStorage, notificationQueue | notificationService |
| **taskCategorizationService.ts** | Smart auto-categorization | geminiService | useTodoLogic, voiceCommandService |
| **analyticsService.ts** | Event tracking, metrics | activityLogger | App.tsx, multiple components |
| **crashReportingService.ts** | Error logging (local) | storageQuota | ErrorBoundary, global handlers |
| **userPreferencesService.ts** | User settings persistence | storageQuota, validators | SettingsModal, App.tsx |
| **backupService.ts** | Export/import todos | dataMigrationService, validators | ExportDashboard |
| **apiKeyService.ts** | Secure API key management | csrfService | App.tsx, geminiService |
| **securityService.ts** | XSS prevention, sanitization | csrfService | Forms, inputs across app |
| **rateLimitService.ts** | API call throttling | - | geminiService, notificationService |
| **behavioralStorage.ts** | ML model persistence | debounce, storageQuota | enhancedLearningEngine |
| **messageGenerationService.ts** | Nudge message creation | abTestService | notificationService |
| **performanceMonitor.ts** | Perf metrics tracking | logger | App initialization |
| **neuralNudgeHealthMonitor.ts** | System health checks | storageQuota | NeuralNudgeDashboard |

#### **Supporting Services**

- **abTestService.ts** - A/B testing framework
- **activityLogger.ts** - User action logging
- **csrfService.ts** - CSRF token management
- **dataMigrationService.ts** - Schema migrations
- **errorHandlerService.ts** - Global error handling
- **notificationQueue.ts** - Notification scheduling
- **preferencesService.ts** - Additional settings
- **secureLogger.ts** - Secure logging utility
- **stateValidationLogger.ts** - State integrity checks
- **storageHealthAnalyzer.ts** - Storage diagnostics
- **structuredExporter.ts** - Data export utilities

#### **Test Services**

- **neuralNudgeTestSuite.ts** - Neural nudge testing
- **phase2-6TestRunner.ts** - Integration tests

---

### Layer 4: Utilities

**Location:** `/utils/` (8 core utilities)

```
utils/
├── logger.ts              # Centralized logging (ConditionalLogger)
├── safeJson.ts            # Safe JSON.parse with fallbacks
├── validators.ts          # Data validation (Todo, Template)
├── storageQuota.ts        # Quota management, cleanup
├── debounce.ts            # Debouncing, throttling, batching
├── crossTabSync.ts        # BroadcastChannel sync
├── storageHealthMonitor.ts # Health checks, auto-recovery
└── storage.ts             # Legacy storage utilities
```

**Utility Integration:**

```
Services Layer
  ↓ imports
logger.ts (used in 30+ files)
safeJson.ts (used in 8+ storage files)
validators.ts (offlineStorageService, indexedDBService)
storageQuota.ts (4 storage services)
debounce.ts (behavioralStorage)
crossTabSync.ts (future: multi-tab support)
storageHealthMonitor.ts (monitoring dashboard)
```

---

### Layer 5: Configuration & Constants

**Location:** `/constants/` + `/config/`

```
constants/
└── storageConstants.ts    # All storage magic strings
    ├── STORAGE_KEYS      # localStorage keys
    ├── STORAGE_LIMITS    # Size/item limits
    ├── INDEXEDDB_CONFIG  # DB configuration
    ├── QUOTA_CONFIG      # Quota thresholds
    └── SYNC_CONFIG       # Cross-tab sync

constants.tsx              # App-wide constants (CATEGORIES, etc.)

config/
├── behavioralConstants.ts # ML/learning parameters
└── chartConstants.ts      # Chart configurations
```

---

## 🔄 Data Flow Diagram

### Primary Todo CRUD Flow

```
┌──────────────┐
│    User      │
│  Interaction │
└──────┬───────┘
       │
       ↓
┌──────────────────┐
│   TodoInput.tsx  │  (User types/speaks)
│   TodoCard.tsx   │  (User clicks/edits)
└──────┬───────────┘
       │
       ↓
┌─────────────────────────────────────┐
│      useTodoLogic Hook              │
│  - handleAddTodo()                  │
│  - handleDeleteTodo()               │
│  - handleUpdateTodo()               │
│  - handleVoiceCommand()             │
└──────┬──────────────────────────────┘
       │
       ├─→ [Voice Input] → speechService → voiceCommandService
       │
       ├─→ [AI Features] → geminiService → taskCategorizationService
       │
       ↓
┌──────────────────┐
│   todoStore      │  (Zustand)
│   - addTodo()    │
│   - updateTodo() │
│   - deleteTodo() │
└──────┬───────────┘
       │
       ↓
┌────────────────────────────────────────┐
│   offlineStorageService                │
│   - saveTodos(todos)                   │
│   - Validates with validators.ts       │
│   - Checks quota with storageQuota.ts  │
└──────┬─────────────────────────────────┘
       │
       ├─→ localStorage.setItem('curvycloud_todos', JSON.stringify(todos))
       │
       └─→ indexedDBService.saveTodos(todos)  [async backup]
       
       ↓
┌──────────────────────────────┐
│   Persistence Complete       │
│   - localStorage (sync)      │
│   - IndexedDB (async)        │
│   - Cross-tab sync triggered │
└──────────────────────────────┘
```

### Neural Nudge Flow

```
┌─────────────────────┐
│  User completes     │
│  or dismisses todo  │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────────────┐
│  notificationService         │
│  - logUserInteraction()      │
└──────┬───────────────────────┘
       │
       ↓
┌───────────────────────────────────┐
│  enhancedLearningEngine           │
│  - processInteraction()           │
│  - updatePredictiveModel()        │
│  - calculateOptimalTiming()       │
└──────┬────────────────────────────┘
       │
       ↓
┌────────────────────────────┐
│  behavioralStorage         │
│  - saveUserModel()         │
│  - Debounced write (500ms) │
└──────┬─────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  localStorage (behavioral data) │
└─────────────────────────────────┘

[Later, when nudge needed...]

┌──────────────────────┐
│  Scheduled trigger   │
└──────┬───────────────┘
       │
       ↓
┌───────────────────────────────┐
│  notificationQueue            │
│  - processQueue()             │
└──────┬────────────────────────┘
       │
       ↓
┌────────────────────────────────┐
│  messageGenerationService      │
│  - A/B test message variants   │
└──────┬─────────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│  Capacitor LocalNotifications│
│  - schedule()                │
│  - trigger()                 │
└──────────────────────────────┘
```

---

## 🔗 Component Integration Map

### App.tsx (Main Component)

**Role:** Root component, orchestrates entire app

**Imports (Direct Dependencies):**
```typescript
// State & Logic
- useTodoLogic (primary data interface)
- useTodoStore (direct store access)

// Services (15+)
- notificationService (push, haptics, nudges)
- crashReportingService (error handling)
- analyticsService (event tracking)
- preferencesService (user settings)
- userPreferencesService (additional settings)
- geminiService (API validation)
- apiKeyService (key management)

// Components (20+)
- TodoCard, TodoInput, TodoBundle (core features)
- Header, Footer (layout)
- All modals (ApiKey, Settings, Library, Review, NeuralNudge)
- ErrorBoundary (error catching)
- Onboarding (first-time UX)

// Utils
- logger (logging)

// Constants
- CATEGORIES (todo categories)
```

**Data Flow:**
```
App.tsx
  ├─→ useTodoLogic() ──→ gets all state & handlers
  ├─→ passes props to children components
  ├─→ manages modal visibility states
  ├─→ handles offline queue syncing
  └─→ initializes services on mount
```

### useTodoLogic Hook (Core Business Logic)

**Role:** Central hub for all todo-related operations

**Internal State (15+ useState):**
- `input`, `isRecording`, `isLoading`, `aiStatus`
- `filter`, `searchQuery`, `sortBy`, `groupBy`
- `showCompleted`, `categoryFilter`, `priorityFilter`
- etc.

**External Dependencies:**
```typescript
Stores:
- useTodoStore (Zustand) - state mutations

Services:
- offlineStorageService - persistence
- geminiService - AI features
- speechService - voice input
- voiceCommandService - command parsing
- taskCategorizationService - auto-categorize
- notificationService - haptics/nudges

Hooks:
- useNetworkStatus - online/offline state

Utils:
- logger - debugging
```

**Exposed API (30+ functions):**
```typescript
State:
- todos, templates, input, filter, aiStatus, etc.

Handlers:
- handleAddTodo, handleDeleteTodo, handleUpdateTodo
- handleVoiceInput, handleAITemplateGeneration
- handleSearch, handleFilter, handleSort
- toggleRecording, setCategory, setPriority

Computed:
- filteredTodos, groupedTodos
- stats (total, completed, etc.)
```

---

## 🗄️ Storage Architecture

### Dual-Layer Storage System

```
┌───────────────────────────────────────────────────────┐
│                   APPLICATION                         │
└─────────────────────┬─────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ↓                           ↓
┌─────────────────┐         ┌──────────────────┐
│  localStorage   │         │   IndexedDB      │
│  (Primary)      │←────────│   (Async Backup) │
└─────────┬───────┘         └──────────────────┘
          │                          ↑
          │                     Fallback on
          │                     IDB unavailable
          │
    ┌─────┴──────┬────────────┬──────────────┐
    │            │            │              │
    ↓            ↓            ↓              ↓
┌────────┐  ┌─────────┐  ┌──────┐  ┌────────────┐
│ Todos  │  │Templates│  │Queue │  │Behavioral  │
│ 1000   │  │  100    │  │ 100  │  │Models      │
│ max    │  │  max    │  │ max  │  │ (90 days)  │
└────────┘  └─────────┘  └──────┘  └────────────┘
```

### Storage Services Hierarchy

```
offlineStorageService (Primary Interface)
  ├─→ Uses: validators.ts (validation)
  ├─→ Uses: storageQuota.ts (quota management)
  ├─→ Uses: debounce.ts (write batching)
  ├─→ Uses: safeJson.ts (safe parsing)
  ├─→ Uses: STORAGE_KEYS constants
  └─→ Stores to: localStorage

indexedDBService (Async Layer)
  ├─→ Fallback: offlineStorageService
  ├─→ Uses: INDEXEDDB_CONFIG constants
  ├─→ Transaction timeout: 30s
  ├─→ Auto-abort on error
  └─→ Stores to: IndexedDB

behavioralStorage (ML Models)
  ├─→ Uses: debounce.ts (500ms batching)
  ├─→ Uses: storageQuota.ts (cleanup)
  ├─→ Pending writes queue
  └─→ Stores to: localStorage

storageHealthMonitor (Monitoring)
  ├─→ Monitors: quota usage
  ├─→ Detects: corruption
  ├─→ Auto-recovery: cleanup
  └─→ Reports: health status
```

### Storage Keys Map

```typescript
STORAGE_KEYS = {
  TODOS: 'curvycloud_todos'
  TEMPLATES: 'curvycloud_templates'
  OFFLINE_QUEUE: 'curvycloud_offline_queue'
  LAST_SYNC: 'curvycloud_last_sync'
  USER_PREFERENCES: 'curvycloud_user_preferences'
  BEHAVIORAL_MODELS: 'loop_behavioral_models'
  CRASH_REPORTS: 'curvycloud_crash_reports'
  CSRF_TOKEN: 'curvycloud_csrf_token'
}
```

### Cross-Tab Synchronization

```
Tab 1                    Tab 2                    Tab 3
  │                        │                        │
  ├─ updateTodo() ────────→│                        │
  │                        │                        │
  ├─ localStorage.set()    │                        │
  │                        │                        │
  ├─ BroadcastChannel ─────┼──────────────────────→│
  │   .postMessage()       │                        │
  │                        │                        │
  │                        ├─ receives message      │
  │                        │                        │
  │                        ├─ updates local state   │
  │                        │                        │
  │                        │                   ├─ receives
  │                        │                   │   message
  │                        │                   │
  │                        │                   ├─ updates
  │                        │                        state
```

---

## 📦 State Management

### Zustand Store Pattern

```typescript
todoStore (Single Source of Truth)
  ├─ todos: Todo[]           # Normalized array
  ├─ templates: Template[]   # Normalized array
  │
  ├─ Actions (8 methods)
  │   ├─ addTodo()          # Prepend new todo
  │   ├─ deleteTodo()       # Filter out by id
  │   ├─ updateTodo()       # Map & merge updates
  │   ├─ loadTodos()        # Bulk replace
  │   ├─ addTemplate()
  │   ├─ deleteTemplate()
  │   ├─ updateTemplate()
  │   └─ loadTemplates()
  │
  └─ Persistence (via effects in useTodoLogic)
      └─ On every change → offlineStorageService.saveTodos()
```

### State Flow

```
Component/Hook triggers action
  ↓
todoStore.addTodo(newTodo)
  ↓
Zustand updates internal state
  ↓
All subscribers re-render
  ↓
useTodoLogic useEffect detects change
  ↓
offlineStorageService.saveTodos(todos)
  ↓
localStorage + IndexedDB updated
```

---

## 🌐 External Integrations

### 1. Google Gemini AI

**Integration Point:** `geminiService.ts`

```
App → useTodoLogic → geminiService
  ↓
geminiService
  ├─ Uses: apiKeyService (API key retrieval)
  ├─ Uses: rateLimitService (throttling)
  ├─ Calls: fetch('https://generativelanguage.googleapis.com/...')
  └─ Returns: AI-generated templates/categories

Rate Limits:
- 15 requests/minute (enforced by rateLimitService)
- Exponential backoff on errors
```

**Features:**
- Template generation from prompts
- Smart categorization
- Task suggestions

### 2. Capacitor Plugins

**Integration:** Native mobile features via `@capacitor/*`

```
notificationService
  ├─→ @capacitor/local-notifications
  │    └─ schedule(), cancel(), list()
  │
  ├─→ @capacitor/haptics
  │    └─ impact(), notification(), vibrate()
  │
  └─→ @capacitor/push-notifications
       └─ register(), addListener()

speechService
  └─→ @capacitor-community/speech-recognition
       └─ start(), stop(), addListener()

App Detection
  └─→ @capacitor/core (Capacitor.getPlatform())
```

**Platforms:**
- Web (PWA)
- Android (via Capacitor)
- iOS (via Capacitor)

### 3. Browser APIs

```
Web APIs Used:
├─ localStorage (primary storage)
├─ IndexedDB (async storage)
├─ BroadcastChannel (cross-tab sync)
├─ Storage API (quota estimation)
├─ Web Speech API (fallback voice)
├─ Notification API (web notifications)
├─ Service Worker (sw.js - offline support)
└─ Navigator.onLine (network status)
```

---

## ⚡ Event Flow

### Application Lifecycle

```
1. App Initialization (index.tsx → App.tsx)
   ├─ React.StrictMode wrapper
   ├─ ErrorBoundary wraps App
   ├─ Load test runner (dev mode)
   └─ Render <App />

2. App Mount (App.tsx useEffect)
   ├─ Initialize crashReportingService
   ├─ Initialize analyticsService
   ├─ Initialize performanceMonitor
   ├─ Load preferences (preferencesService)
   ├─ Register push notifications
   ├─ Check API key status
   └─ Trigger onboarding if new user

3. Data Load (useTodoLogic useEffect)
   ├─ offlineStorageService.getTodos()
   ├─ offlineStorageService.getTemplates()
   ├─ Validate data (validators.ts)
   ├─ todoStore.loadTodos(todos)
   ├─ todoStore.loadTemplates(templates)
   └─ Migrate to IndexedDB (if needed)

4. User Interaction Loop
   ├─ User action (click, type, speak)
   ├─ Component handler calls useTodoLogic method
   ├─ useTodoLogic updates todoStore
   ├─ Zustand notifies subscribers
   ├─ Components re-render
   ├─ useEffect persists to storage
   └─ Analytics logged

5. Background Tasks
   ├─ Neural nudge scheduling (notificationQueue)
   ├─ Behavioral model updates (enhancedLearningEngine)
   ├─ Health monitoring (storageHealthMonitor)
   └─ Offline queue processing

6. App Unmount
   ├─ Flush pending writes (behavioralStorage.flush())
   ├─ Save final state
   └─ Cleanup listeners
```

### User Action Event Chain

**Example: User completes a todo**

```
1. TodoCard.tsx
   └─ onClick → handleUpdate({ completed: true })

2. useTodoLogic.handleUpdateTodo()
   ├─ Call todoStore.updateTodo(id, { completed: true })
   └─ Trigger haptic feedback (notificationService.triggerHaptic())

3. todoStore.updateTodo()
   └─ Zustand: set((state) => ({ todos: state.todos.map(...) }))

4. React Re-renders
   ├─ useTodoLogic (subscriber)
   ├─ App.tsx (subscriber)
   └─ TodoCard (prop change)

5. useTodoLogic useEffect (todos changed)
   └─ offlineStorageService.saveTodos(todos)

6. offlineStorageService.saveTodos()
   ├─ Validate: validators.validateTodo()
   ├─ Check quota: storageQuota.safeWrite()
   ├─ Write: localStorage.setItem()
   └─ Async: indexedDBService.saveTodos()

7. Analytics & Learning
   ├─ analyticsService.track('todo_completed')
   ├─ notificationService.logInteraction()
   └─ enhancedLearningEngine.processInteraction()

8. Cross-Tab Sync
   └─ crossTabSync.broadcast('curvycloud_todos', newValue)
```

---

## 🎯 Critical Paths

### Path 1: Add Todo (Happy Path)

```
TodoInput (user types "Buy milk")
  ↓
handleAddTodo()
  ↓
Create Todo object with:
  - id: crypto.randomUUID()
  - text: "Buy milk"
  - completed: false
  - createdAt: Date.now()
  - priority: 'medium'
  ↓
[Voice Mode?]
  YES → voiceCommandService.parseCommand()
        → Extract category/priority
  NO  → Continue
  ↓
[AI Categorization?]
  YES → taskCategorizationService.categorize()
        → geminiService.categorize()
        → Add category to todo
  NO  → Continue
  ↓
todoStore.addTodo(todo)
  ↓
Zustand updates state
  ↓
offlineStorageService.saveTodos()
  ↓
Success! Todo visible in UI
```

### Path 2: Voice Command

```
User clicks mic button
  ↓
toggleRecording()
  ↓
speechService.startNativeVoice() or startWebVoice()
  ↓
Capacitor SpeechRecognition API or Web Speech API
  ↓
User speaks: "Add high priority task buy groceries"
  ↓
onResult(transcript)
  ↓
voiceCommandService.parseVoiceCommand(transcript)
  ├─ Detect intent: 'add'
  ├─ Extract priority: 'high'
  └─ Extract text: 'buy groceries'
  ↓
handleVoiceCommand(parsedCommand)
  ↓
[Command type: 'add']
  └─ handleAddTodo(parsedData)
      ↓
      todoStore.addTodo(newTodo)
      ↓
      Success! Todo created from voice
```

### Path 3: AI Template Generation

```
User types "Plan a birthday party" in AI modal
  ↓
handleAITemplateGeneration()
  ↓
geminiService.generateTemplateFromPrompt(prompt)
  ├─ Check: apiKeyService.getStoredApiKey()
  ├─ Check: rateLimitService.canMakeRequest()
  ├─ Call: Google Gemini API
  └─ Return: Template with items[]
  ↓
Display items to user
  ↓
User confirms
  ↓
saveAsTemplate()
  ↓
todoStore.addTemplate(template)
  ↓
offlineStorageService.saveTemplates()
  ↓
Template saved! Available in library
```

### Path 4: Neural Nudge Delivery

```
[Background: User has pending todos]
  ↓
notificationQueue.processQueue() (scheduled)
  ↓
enhancedLearningEngine.predictOptimalTime()
  ├─ Load: behavioralStorage.loadUserModel()
  ├─ Analyze: user patterns, completion times
  └─ Return: best time = NOW
  ↓
messageGenerationService.generateMessage()
  ├─ A/B test: abTestService.getVariant()
  ├─ Personalize: based on user model
  └─ Return: "You usually complete tasks now! 🎯"
  ↓
notificationService.sendNudge()
  ├─ Capacitor.LocalNotifications.schedule()
  └─ Log: activityLogger.log()
  ↓
User receives notification
  ↓
[User taps notification]
  └─ App opens, navigates to todo
```

### Path 5: Offline → Online Sync

```
User works offline
  ↓
Network goes down
  ↓
useNetworkStatus() detects: isOnline = false
  ↓
User adds/updates todos
  ↓
handleAddTodo() / handleUpdateTodo()
  ↓
offlineStorageService.addToQueue(action, type, data)
  ├─ Queue item created
  └─ Saved to localStorage
  ↓
Network restored
  ↓
useNetworkStatus() detects: isOnline = true
  ↓
useTodoLogic useEffect (isOnline changed)
  ↓
processOfflineQueue()
  ├─ Get: offlineStorageService.getQueue()
  ├─ For each item:
  │   ├─ Execute action (add/update/delete)
  │   └─ Mark as processed
  ├─ Clear queue
  └─ Analytics: track sync event
  ↓
All changes synced!
```

---

## 🔍 Dependency Graph

### High-Level Service Dependencies

```
notificationService
  ├─ enhancedLearningEngine
  │   ├─ behavioralStorage
  │   │   ├─ debounce
  │   │   └─ storageQuota
  │   ├─ notificationQueue
  │   └─ LEARNING_CONSTANTS
  ├─ messageGenerationService
  │   └─ abTestService
  ├─ Capacitor plugins
  └─ logger

geminiService
  ├─ apiKeyService
  │   └─ csrfService
  ├─ rateLimitService
  └─ logger

offlineStorageService
  ├─ validators
  ├─ storageQuota
  │   └─ logger
  ├─ debounce
  ├─ safeJson
  └─ STORAGE_KEYS

indexedDBService
  ├─ offlineStorageService (fallback)
  ├─ validators
  ├─ safeJson
  └─ INDEXEDDB_CONFIG

speechService
  ├─ Capacitor SpeechRecognition
  ├─ Web Speech API
  └─ logger

voiceCommandService
  ├─ taskCategorizationService
  │   └─ geminiService
  └─ logger
```

---

## 📊 Component Hierarchy

```
index.tsx
  └─ <ErrorBoundary>
      └─ <App>
          ├─ <Header>
          │   ├─ Search input
          │   ├─ Settings button → <SettingsModal>
          │   └─ User menu
          │
          ├─ [Conditional: Onboarding]
          │   └─ <Onboarding>
          │
          ├─ <TodoInput>
          │   ├─ Text input
          │   ├─ Voice button (microphone)
          │   ├─ Category selector
          │   └─ Priority selector
          │
          ├─ Filters Bar
          │   ├─ Show completed toggle
          │   ├─ Category filter
          │   └─ Sort selector
          │
          ├─ Todo List
          │   ├─ <TodoBundle> (for templates)
          │   │   └─ Multiple <TodoCard>
          │   └─ Individual <TodoCard>
          │       ├─ Checkbox
          │       ├─ Text display
          │       ├─ Priority badge
          │       ├─ Category tag
          │       └─ Actions (edit, delete)
          │
          ├─ <Footer>
          │   ├─ Stats display
          │   ├─ Add button
          │   └─ Export button
          │
          └─ Modals (conditional)
              ├─ <ApiKeyModal>
              ├─ <SettingsModal>
              ├─ <LibraryModal> (templates)
              ├─ <ReviewModal> (todos review)
              ├─ <NeuralNudgeDashboard>
              ├─ <ExportDashboard>
              └─ <UnifiedTestDashboard>
```

---

## 🧪 Testing Infrastructure

```
tests/
├─ testRunner.ts              # Main test orchestrator
├─ services/
│   ├─ notificationService.test.ts
│   ├─ geminiService.test.ts
│   └─ errorHandlerService.test.ts
└─ Integration test services
    ├─ phase2TestRunner.ts    # Timing tests
    ├─ phase3TestRunner.ts    # Intelligence tests
    ├─ phase4TestRunner.ts    # Command tests
    ├─ phase5TestRunner.ts    # Backup tests
    └─ phase6TestRunner.ts    # Advanced tests

scripts/
├─ test-*.sh                  # Shell test scripts
└─ test-*.js                  # Node test scripts

Development Commands:
- window.runTests()           # Run comprehensive tests
- window.removeDebugLogs()    # Clean up console
```

---

## 🔐 Security Layer

```
securityService
  ├─ sanitizeInput() → XSS prevention
  ├─ validateTodoInput() → Input validation
  └─ escapeHTML() → Output encoding

csrfService
  ├─ generateToken() → CSRF token generation
  ├─ validateToken() → Token verification
  └─ refreshToken() → Token rotation

apiKeyService
  ├─ Secure storage
  ├─ CSRF protection
  └─ Validation before use

Flow:
User Input
  ↓
securityService.sanitizeInput()
  ↓
securityService.validateTodoInput()
  ↓
Process safely
  ↓
Store with csrfService protection
```

---

## 📱 Mobile Integration (Capacitor)

```
Platform Detection:
Capacitor.getPlatform()
  ├─ 'web' → Use web APIs
  ├─ 'android' → Use native plugins
  └─ 'ios' → Use native plugins

Native Features:
├─ Push Notifications (android/ios only)
├─ Local Notifications (all platforms)
├─ Haptic Feedback (mobile enhanced)
├─ Speech Recognition (native preferred)
└─ Storage (same APIs, platform-optimized)

Configuration:
capacitor.config.ts
  └─ App ID: 'com.loop.todo'
  └─ Plugin configs
```

---

## 🎨 Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   USER INTERFACE (React Components)                            │
│   App.tsx, TodoCard, TodoInput, Modals, etc.                   │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ↓                 ↓
        ┌──────────────────┐  ┌──────────────────┐
        │  useTodoLogic    │  │   todoStore      │
        │  (Hook Layer)    │←→│   (Zustand)      │
        └────────┬─────────┘  └──────────────────┘
                 │
        ┌────────┴────────────────────────────────┐
        │                                         │
        ↓                                         ↓
┌──────────────────┐                    ┌──────────────────┐
│  AI Services     │                    │  Storage         │
│  - gemini        │                    │  - offline       │
│  - categorize    │                    │  - indexedDB     │
│  - voice         │                    │  - behavioral    │
└──────────────────┘                    └──────────────────┘
        │                                         │
        ↓                                         ↓
┌──────────────────────────────────────────────────────────┐
│              Support Services                            │
│  Analytics, Monitoring, Security, Logging, etc.          │
└──────────────────────────────────────────────────────────┘
```

---

## 🏁 Conclusion

Loop Community is a well-architected application with:

- **Clear separation of concerns** (UI → Logic → Services → Storage)
- **Resilient storage** (dual-layer with fallbacks)
- **Smart state management** (Zustand + custom hooks)
- **Comprehensive error handling** (ErrorBoundary + crash reporting)
- **Offline-first architecture** (queue + sync)
- **AI-powered features** (Gemini integration)
- **Cross-platform support** (PWA + Capacitor)
- **Production-ready** (monitoring, health checks, analytics)

All 35 services, 8 utilities, and 20+ components work together seamlessly through well-defined interfaces and dependency injection patterns.

---

**Document Version:** 1.0  
**Created:** January 4, 2026  
**Maintainer:** Development Team
