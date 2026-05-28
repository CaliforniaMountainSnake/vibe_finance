Status: ready-for-agent

## Parent

[PRD: Карточная раскладка списка средств](../PRD.md)

## What to build

Интегрировать новые карточные компоненты в `HoldingsCard` и удалить старый табличный код.

**Изменения в `HoldingsCard`:**

- Вместо `<HoldingsTable>` — список `<HoldingCardItem>` + `<HoldingsTotalCard>` внутри `CardContent` с `flex flex-col gap-2`.
- `CardFooter` для таблицы больше не нужен — итог встроен в `CardContent`.
- Пустое состояние (текст «Нет сохранённых средств») остаётся без изменений.

**Удалить:**

- `HoldingsTable.tsx` — заменён карточным списком.
- Все импорты shadcn `Table*` компонентов, если они больше нигде не используются.

**Результат:** единый карточный лейаут на всех разрешениях, без горизонтального скролла.

## Acceptance criteria

- [ ] `HoldingsCard` использует `HoldingCardItem` и `HoldingsTotalCard` вместо таблицы
- [ ] Карточки стекаются вертикально с gap
- [ ] Итоговая карточка визуально отличается (muted фон)
- [ ] Пустое состояние работает как раньше
- [ ] Горизонтальный скролл отсутствует при любом размере шрифта на мобильном
- [ ] `HoldingsTable.tsx` удалён
- [ ] `HoldingRowActions.tsx` обновлён (убрано разделение Mobile/Desktop)
- [ ] Все юнит-тесты проходят (`npm run test`)
- [ ] Линтер не выдаёт ошибок (`npm run lint`)

## Blocked by

- 02-holding-card-item
- 03-holdings-total-card
