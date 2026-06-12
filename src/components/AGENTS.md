# COMPONENT ARCHITECTURE

**Updated:** 2026-06-12
**Branch:** refactor/code-quality

## OVERVIEW

Atomic design: `atoms/` (primitive UI), `molecules/` (composed widgets), `organisms/` (feature-level components, including all bottom sheets). Each tier has an `index.ts` barrel.

## STRUCTURE

```
components/
├── index.ts                       # Re-exports the three tiers
├── atoms/                         # Primitives: Button, BaseCard, UncontrolledInput,
│                                  # MemoizedInput, BottomSheetHeader, FormSection, Toggle, ...
├── molecules/                     # Composed widgets: ItemCard, MemberCard, SwipeableRow,
│                                  # CategorySelector, DatePicker, SearchInput, settings rows, ...
└── organisms/
    ├── bottom-sheets/             # ALL *BottomSheet components (item/batch forms, auth,
    │   │                          # home, category, invitation, nickname, error, offline)
    │   └── shared/sheetPrimitives.tsx  # Shared styled primitives: Backdrop, ContentContainer,
    │                                   # FooterContainer, ... for full-screen form sheets
    ├── forms/                     # ItemFormFields (shared field block for item create/edit)
    ├── ContextMenu/               # Long-press context menu (provider + overlay)
    ├── UnitPicker/                # Unit dropdown overlay (context + overlay)
    └── BottomNavBar, PageHeader, TodoCard, HomeSwitcher, MemberList, ToastProvider, ...
```

## WHERE TO LOOK

| Task              | Location                                        | Notes                                                          |
| ----------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| Item create/edit  | `organisms/bottom-sheets/ItemFormBottomSheet.tsx` | Single sheet, `create`/`edit` modes; fields in `organisms/forms/ItemFormFields.tsx` |
| Batch add/edit    | `organisms/bottom-sheets/BatchFormBottomSheet.tsx` | Single sheet, `add`/`edit` modes (uses `useBatchForm`)         |
| Sheet scaffolding | `organisms/bottom-sheets/shared/sheetPrimitives.tsx` | Shared Backdrop/ContentContainer/Footer styled primitives    |
| Sheet lifecycle   | `src/hooks/useBottomSheetLifecycle.ts`           | Open/close/reset (`formKey`) handling for sheets               |
| Swipe actions     | `molecules/SwipeableRow.tsx`                     | Shared iOS-style swipe-to-edit/delete                          |
| Reusable UI       | `atoms/`                                         | Button, BaseCard, UncontrolledInput with index.ts exports      |
| Styled components | All tiers                                        | Theme injection via `StyledProps` from `utils/styledComponents.ts` |

## CONVENTIONS

- **Uncontrolled inputs**: Bottom sheets use `defaultValue` + refs for IME composition support
- **Ref pattern**: Store current value in ref (`onChangeText`), sync to state on blur/submit
- **Reset with key**: Increment `key` prop (`formKey` from `useBottomSheetLifecycle`) to reset form state on close
- **Top-level BottomSheetModal styling**: set `backgroundStyle={{ backgroundColor: theme.colors.background }}` and use the rounded `ContentContainer` from `sheetPrimitives` for dark mode
- **Barrel exports**: each tier's `index.ts` exports components (and prop types where defined)
- **Theme injection**: All styled components use `({ theme }: StyledProps) => theme.colors.surface`

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use controlled inputs (`value` prop) in bottom sheet modals - breaks IME composition
- **ALWAYS** use `BottomSheetTextInput` from @gorhom/bottom-sheet in bottom sheets
- **NEVER** duplicate styled component definitions - use `sheetPrimitives.tsx` / extract to shared files
- **NEVER** create a separate Create*/Edit* sheet pair for one entity - use a single mode-driven form sheet (see ItemFormBottomSheet, BatchFormBottomSheet)
