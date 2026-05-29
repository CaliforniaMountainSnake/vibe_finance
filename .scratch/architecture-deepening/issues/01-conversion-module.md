Status: done

## What to build

Выделить модуль **Conversion** — глубокий модуль, собирающий всю логику конвертации средств в итоговую валюту в одном месте, за одним интерфейсом.

Сейчас конвертация размазана: `computeConverted` в `lib/compute-converted.ts`, `computeTotalAmount` в `lib/compute-total.ts`, `computeRate` и `computeConversionRates` прямо в компоненте `HoldingsCard`. Нет единого шва, через который можно протестировать весь конвейер.

**Интерфейс модуля:**

- `convert(holdings, getRate, totalTicker) → ConvertedResult[]` — для каждого holding вычисляет конвертированную сумму и возвращает структурированный результат
- Внутри: проход по holding'ам, вызов адаптера `getRate(pair) → number`, `computeConverted`, `computeTotalAmount` — всё скрыто за интерфейсом

**Адаптер `getRate`** передаётся через шов (аргумент), а не вызывается напрямую — модуль не знает про `dbRepo`. В production это `dbRepo.getRate`, в тестах — in-memory заглушка.

## Acceptance criteria

- [ ] Модуль Conversion живёт в `lib/conversion.ts` с единственной экспортируемой функцией `convert`
- [ ] Функция `convert` принимает: `holdings: Holding[]`, `getRate: (pair: TickerPair) => Promise<number | undefined>`, `totalTicker: Ticker | null`
- [ ] `convert` возвращает `Promise<ConvertedResult[]>` — массив структур с `holdingId`, `converted: string | undefined`, `rate: number | undefined`
- [ ] `computeConverted`, `computeTotalAmount`, `computeRate`, `computeConversionRates` втянуты внутрь модуля как приватные
- [ ] `HoldingsCard` переключён на `convert()` — удалены `computeRate` и `computeConversionRates` из компонента
- [ ] Тесты `computeConverted.test.ts` и `computeTotalAmount.test.ts` заменены на тесты модуля `convert()` через единый шов (in-memory `getRate`)
- [ ] Линтер не выдаёт ошибок (`npm run lint`)
- [ ] Все тесты проходят (`npm run test`)

## Blocked by

None - can start immediately
