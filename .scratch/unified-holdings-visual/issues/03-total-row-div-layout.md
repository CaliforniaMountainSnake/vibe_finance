# 03-total-row-div-layout

Status: ready-for-agent

## Parent

[PRD: Единый визуал карточки «Мои средства»](../PRD.md)

## What to build

Убрать обёртку `<Card size="sm" className="bg-muted/50">` из `HoldingsTotalCard`, заменив на `<div>`-ряд с `bg-muted/30`, `border-t`, `px-4`, `py-2`. Итоговая строка визуально выделяется затемнённым фоном и верхней границей, но остаётся в общем потоке рядов.

`CardTitle` и `CardAction` заменяются на обычные `div` с эквивалентными стилями.

`TotalCurrencyPicker` и логика форматирования суммы — без изменений.

## Acceptance criteria

- [ ] `<Card size="sm">` заменён на `<div>` с `bg-muted/30`, `border-t`, `px-4`, `py-2`
- [ ] `CardTitle`/`CardAction` заменены на `div` с сохранением визуала
- [ ] Итоговая сумма и выбор валюты (`TotalCurrencyPicker`) работают как раньше
- [ ] Визуальный осмотр: итоговая строка выделена фоном, разделена верхней границей, касается боковых краёв карточки

## Blocked by

- [01-holdings-card-footer-layout](./01-holdings-card-footer-layout.md)
