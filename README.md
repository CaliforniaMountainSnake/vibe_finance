<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/MVP-FF6B6B?style=flat-square&logo=rocket&logoColor=white">
  <img alt="MVP" src="https://img.shields.io/badge/MVP-FF6B6B?style=flat-square&logo=rocket&logoColor=white">
</picture>
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=flat-square&logo=capacitor&logoColor=white)
![Dexie](https://img.shields.io/badge/Dexie.js-4B8BBE?style=flat-square&logo=indexeddb&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)

<p align="center">
  <br/>
  <img src="public/favicon.ico" width="64" height="64" alt="Vibe Finance logo" />
  <h1 align="center">Vibe Finance</h1>
  <p align="center">
    <strong>Минималистичный криптокошелёк и трекер курсов</strong>
    <br />
    <em>Всё локально. Никаких аккаунтов. Работает в браузере и на Android.</em>
  </p>
</p>

<br/>

---

**Vibe Finance** — это PWA-приложение для отслеживания криптовалютных курсов и управления личным портфелем. Данные подтягиваются из **CoinGecko** и **Binance** напрямую с клиента, а портфель и избранное хранятся локально в **IndexedDB** — никаких серверов и регистраций.

---

## Возможности

|                                 |                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 📊 **Два источника курсов**     | CoinGecko (~100+ валют) и Binance (~300+ USDT-пар) — данные из реального времени                                                            |
| ⭐ **Избранные пары**           | Добавляйте любые кросс-курсы, в том числе межбиржевые (Binance BTC → CoinGecko ETH), сортируйте их порядок                                  |
| 💼 **Портфель (Holdings)**      | Ведите учёт средств: добавляйте валюты с количеством, подписывайте позиции (например, «Карта синего банка»), отключайте строки без удаления |
| 💰 **Общая стоимость портфеля** | Выберите базовую валюту — приложение пересчитает все активы в неё по текущему курсу и покажет итог                                          |
| 🌓 **Автоматическая тема**      | Светлая и тёмная темы — следуют за системными настройками устройства                                                                        |
| 📱 **Android APK**              | Собирается в нативное приложение через Capacitor — работает как обычное Android-приложение                                                  |
| 🏠 **Офлайн-режим**             | После загрузки курсов все данные доступны локально, интернет нужен только для обновления                                                    |
| 🔒 **Конфиденциальность**       | Никаких серверов, аккаунтов и телеметрии — всё хранится в вашем браузере                                                                    |

---

## Как это устроено

Приложение получает курсы из двух независимых источников, приводит их к единому формату и сохраняет локально. Для конвертации одной валюты в другую используется цена в BTC (btcPrice) — универсальный якорь, через который вычисляется cross-rate для любой пары, в том числе межбиржевой.

Вся персистентность — на клиенте: IndexedDB через Dexie.js. Четыре таблицы: курсы валют, избранные пары, средства пользователя и настройки. При обновлении курсы для источника перезаписываются целиком.

На устройствах Android приложение работает как нативное — Capacitor упаковывает веб-сборку в APK с поддержкой системной тёмной темы и safe area.

---

## Скриншоты

> _Скоро_

---

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) — приложение готово к использованию.

---

## Команды

### Разработка

| Команда                | Описание                           |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Дев-сервер с HMR                   |
| `npm run build`        | Production-сборка                  |
| `npm run serve`        | Сборка и запуск production-сервера |
| `npm run lint`         | Линтер (ESLint)                    |
| `npm run format`       | Форматирование кода (Prettier)     |
| `npm run format-check` | Проверка форматирования            |

### Тестирование

| Команда                    | Описание                                        |
| -------------------------- | ----------------------------------------------- |
| `npm run test`             | Unit-тесты (Vitest)                             |
| `npm run test:watch`       | Unit-тесты в режиме наблюдения                  |
| `npm run test-integration` | Интеграционные тесты с реальными HTTP-запросами |
| `npm run check-all`        | Всё сразу: тесты + линтер + формат              |

### Android

| Команда             | Описание                                   |
| ------------------- | ------------------------------------------ |
| `npm run build-apk` | Сборка debug APK                           |
| `npm run start-apk` | Сборка и запуск на подключённом устройстве |

> **Требования:** Java JDK 21, Android SDK (`ANDROID_HOME`).<br/>
> Готовый APK: `android/app/build/outputs/apk/debug/`.

---

## Технологии

- **Next.js** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI, Lucide icons)
- **Dexie.js** — клиентская БД на IndexedDB
- **Capacitor** — нативная обёртка для Android
- **Vitest** — тестирование (unit + integration)
- **CoinGecko API** / **Binance API** — источники курсов

---

## Лицензия

MIT

---

<p align="center">
  <sub>
    Сделано на основе <a href="https://github.com/CaliforniaMountainSnake/vibe_app_skeleton">vibe_app_skeleton</a>.<br/>
    С ❤️ для тех, кто ценит приватность и минимализм.
  </sub>
</p>
