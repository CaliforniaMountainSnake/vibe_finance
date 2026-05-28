Status: done

## Parent

[PRD: Карточная раскладка списка средств](../PRD.md)

## What to build

Выделить бизнес-логику расчётов из UI-компонентов в чистые функции в `lib/` и покрыть их unit-тестами.

**Функции:**

- `computeTotalAmount(holdings, conversionRates) → number` — сумма всех enabled holding'ов с валидным rate. Пропускает holding с `enabled: false`, а также holding с undefined или NaN rate.
- `computeConverted(amount, rate) → string | undefined` — конвертированная сумма в строковом представлении. Возвращает `undefined` при undefined или NaN rate.

**Тесты (`tests/unit/`):**

- `computeTotalAmount`: пустой массив, все enabled, все disabled, смешанные, undefined rate, NaN rate.
- `computeConverted`: нормальный расчёт, rate=0, rate undefined, rate NaN.

## Acceptance criteria

- [ ] `computeTotalAmount` вынесена из `holdings-table.tsx` в `lib/compute-total.ts`
- [ ] `computeConverted` вынесена из `holding-row.tsx` в `lib/compute-converted.ts`
- [ ] Оригинальные места вызова используют импорты из `lib/`
- [ ] Unit-тесты для обеих функций проходят (`npm run test`)
- [ ] Линтер не выдаёт ошибок (`npm run lint`)

## Blocked by

None - can start immediately
