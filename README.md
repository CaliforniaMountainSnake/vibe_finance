[![MVP](https://img.shields.io/badge/MVP-FF6B6B?style=flat-square&logo=rocket&logoColor=white)](https://californiamountainsnake.github.io/vibe_finance/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-4B8BBE?style=flat-square&logo=indexeddb&logoColor=white)](https://dexie.org/)
[![Fuse.js](https://img.shields.io/badge/Fuse.js-FFD700?style=flat-square&logo=javascript&logoColor=black)](https://fusejs.io/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black)](https://prettier.io/)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](./LICENSE)

# Vibe Finance

**Минималистичный криптокошелёк и трекер курсов**

_Всё локально. Никаких аккаунтов. Работает в браузере и на Android._

**Vibe Finance** — PWA-приложение для отслеживания курсов валют, акций и криптовалют, а также управления личным портфелем. Данные подтягиваются из **четырёх источников** напрямую с клиента; портфель, избранное и настройки хранятся локально в **IndexedDB** — никаких серверов и регистраций.

🌐 **Живая версия:** [californiamountainsnake.github.io/vibe_finance](https://californiamountainsnake.github.io/vibe_finance/)

## Возможности

| 📊 **4 источника курсов**  | CoinGecko, Binance, Bybit, MOEX (Московская биржа)                                     |
| -------------------------- | -------------------------------------------------------------------------------------- |
| ⭐ **Избранные пары**      | Межбиржевые и межрыночные кросс-курсы (Binance BTC → MOEX IMOEX), перетаскивание строк |
| 🔍 **Поиск валют**         | Нечёткий поиск (Fuse.js) по тикеру и названию при добавлении в избранное и портфель    |
| 💼 **Портфель (Holdings)** | Учёт активов с подписями, отключение строк без удаления, перетаскивание                |
| 💰 **Общая стоимость**     | Пересчёт всех активов в выбранную базовую валюту по текущему курсу                     |
| ⚙️ **Настройки**           | 7 градаций размера шрифта, настройки сохраняются в IndexedDB между сессиями            |
| 🌓 **Автоматическая тема** | Светлая и тёмная темы — следуют за системными настройками устройства                   |
| 📱 **Android APK**         | Нативное приложение через Capacitor                                                    |
| 🏠 **Офлайн-режим**        | Кэшированные курсы доступны локально, интернет нужен только для обновления             |
| 🔒 **Конфиденциальность**  | Никаких серверов, аккаунтов и телеметрии — всё в вашем браузере                        |

## Как это устроено

Приложение получает курсы из четырёх независимых источников:

- **CoinGecko** — ~75+ криптовалют, фиатных валют и товаров (XAG, XAU)
- **Binance** — ~600+ USDT-пар
- **Bybit** — ~440+ USDT-пар
- **MOEX ISS** — ~1200+ инструментов Московской биржи: валюты (USD/RUB, CNY/RUB и др.), индексы (IMOEX, RTSI, MOEXBTC), акции и ETF

Все курсы приводятся к единому формату (btcPrice) и сохраняются локально в IndexedDB через Dexie.js. Для конвертации одной валюты в другую используется цена в BTC — универсальный якорь, через который вычисляется cross-rate для любой пары, в том числе межбиржевой и межрыночной.

На устройствах Android приложение работает как нативное — Capacitor упаковывает веб-сборку в APK.

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) — приложение готово к использованию.

### Android

| Команда             | Описание                                   |
| ------------------- | ------------------------------------------ |
| `npm run build-apk` | Сборка debug APK                           |
| `npm run start-apk` | Сборка и запуск на подключённом устройстве |

> **Требования:** Java JDK 21, Android SDK (`ANDROID_HOME`).
> Минимальная версия Android: **7.0** (API level 24).
>
> Готовый APK: `android/app/build/outputs/apk/debug/`.

## Технологии

- **Next.js** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI, Lucide icons)
- **Dexie.js** — клиентская БД на IndexedDB
- **Capacitor** — нативная обёртка для Android
- **Vitest** — unit + react-компонентные тесты (fake-indexeddb, jsdom)
- **CoinGecko API** / **Binance API** / **Bybit API** / **MOEX ISS API** — источники курсов
- **Fuse.js** — нечёткий поиск по тикерам и названиям
- **ESLint** (typescript-eslint strict, sonarjs, unicorn) + **Prettier**

## Лицензия

MIT

Сделано на основе [vibe_app_skeleton](https://github.com/CaliforniaMountainSnake/vibe_app_skeleton).
С ❤️ для тех, кто ценит приватность и минимализм.
