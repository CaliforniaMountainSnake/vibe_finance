Status: done

## Parent

[PRD: Карточная раскладка списка средств](../PRD.md)

## What to build

Создать компонент `HoldingsTotalCard` — карточку итоговой суммы. shadcn `Card` с `size="sm"` и `bg-muted/50` для визуального отличия от holding-карточек.

Содержит сумму итога (в `CardHeader`/`CardTitle`) и `TotalCurrencyPicker` для смены итоговой валюты (в `CardAction`).

Пропсы: `totalAmount`, `totalTicker`, `totalUnit`, `allRates`, `onTotalTickerChange`.

Логика вычисления `totalAmount` — через `computeTotalAmount` из issue #01.

## Acceptance criteria

- [ ] Компонент `HoldingsTotalCard` создан
- [ ] Имеет `bg-muted/50` для визуального отличия
- [ ] Сумма итога и TotalCurrencyPicker отображаются корректно
- [ ] Использует `computeTotalAmount` из `lib/`
- [ ] Линтер не выдаёт ошибок

## Blocked by

- 01-extract-pure-functions
