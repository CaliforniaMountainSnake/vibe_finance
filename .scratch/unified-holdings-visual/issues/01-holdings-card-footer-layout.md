# 01-holdings-card-footer-layout

Status: ready-for-agent

## Parent

[PRD: Единый визуал карточки «Мои средства»](../PRD.md)

## What to build

Заменить `CardContent` на `CardFooter` с `p-0` в `HoldingsCard` — повторить паттерн `FavoriteRatesCard`. Это уберёт боковые отступы у родительской карточки, и строки holdings/итога (которые позже станут div-рядами от края до края) будут касаться боковых границ карточки.

Убрать `flex flex-col gap-2` с контейнера рядов — разделители между рядами будут через `border-b` самих рядов.

Пустое состояние остаётся внутри с `py-4 text-center` без изменений.

## Acceptance criteria

- [ ] `CardContent` заменён на `CardFooter` с `className="block p-0"`
- [ ] Пустое состояние (`Нет сохранённых средств...`) по-прежнему показывается внутри карточки с `py-4` и `text-center`
- [ ] Внешне карточка выглядит как единый блок без двойных границ (визуальный осмотр)

## Blocked by

None — can start immediately.
