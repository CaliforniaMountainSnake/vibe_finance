Status: ready-for-agent

## What to build

Устранить дублирование логики перестановки (order swap) в `DexieRepository`.

Сейчас `swapWithNeighbor` (для избранных курсов) и `swapHoldingWithNeighbor` (для средств) — два метода с идентичным алгоритмом, отличающиеся только таблицей Dexie. При появлении третьей упорядоченной сущности дублирование разрастётся.

Выделить приватный метод `reorderInPlace(table, id, direction)` внутри `DexieRepository`, параметризованный таблицей. Оба публичных метода делегируют в него.

## Acceptance criteria

- [ ] Приватный метод `reorderInPlace(table, id, direction)` выделен в `DexieRepository`
- [ ] `swapWithNeighbor` и `swapHoldingWithNeighbor` делегируют в `reorderInPlace`
- [ ] Дублированный код (~30 строк) удалён
- [ ] Публичный интерфейс `DbRepositoryInterface` не изменился
- [ ] Существующие тесты `DexieRepository` проходят без изменений
- [ ] Линтер не выдаёт ошибок (`npm run lint`)
- [ ] Все тесты проходят (`npm run test`)

## Blocked by

None - can start immediately
