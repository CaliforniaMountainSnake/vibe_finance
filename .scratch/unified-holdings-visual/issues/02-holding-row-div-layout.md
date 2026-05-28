# 02-holding-row-div-layout

Status: ready-for-agent

## Parent

[PRD: Единый визуал карточки «Мои средства»](../PRD.md)

## What to build

Убрать обёртку `<Card size="sm">` из `HoldingCardItem`, заменив на `<div>`-ряд внутри родительской карточки. Ряд идёт от края до края, разделяется `border-b`, имеет `hover:bg-muted/50` и боковые отступы `px-4`.

Внутренняя структура сохраняется — заголовок с иконкой источника/суммой/тикером, конвертированная строка, label счёта. Компоненты `CardHeader` / `CardContent` / `CardTitle` / `CardAction` заменяются на обычные `div` с эквивалентными стилями.

Действия (десктопные кнопки `CardDesktopActions`, мобильное меню `CardKebabMenu`), диалоги (`HoldingRemoveDialog`, `EditHoldingDialog`), тултип (`HoldingTooltip`) — без изменений.

Класс `opacity-40` для disabled-строк переносится на новый корневой `div`.

## Acceptance criteria

- [ ] `<Card size="sm">` заменён на `<div>` с `border-b`, `px-4`, `py-2`, `hover:bg-muted/50`
- [ ] `CardHeader`/`CardContent`/`CardTitle`/`CardAction` заменены на `div` с сохранением структуры и визуала
- [ ] Строка disabled-holding'а имеет `opacity-40`
- [ ] Тултип с курсом конверсии работает как раньше
- [ ] Кнопки действий (десктоп/мобильные) работают без изменений
- [ ] Диалоги редактирования/удаления открываются и работают корректно
- [ ] Длинные названия счетов переносятся на всю ширину без горизонтального скролла
- [ ] Визуальный осмотр: строки касаются боковых границ карточки, разделители на всю ширину

## Blocked by

- [01-holdings-card-footer-layout](./01-holdings-card-footer-layout.md)
