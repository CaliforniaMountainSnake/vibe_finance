# Vibe App Skeleton

Приложение-скелетон для быстрого создания веб-приложений на Next.js с возможностью сборки в APK для Android.

Используйте этот проект как основу для своих идей — вся инфраструктура уже настроена, остаётся только писать код.

Минимальная поддерживаемая версия Android: **7.0** (API level 24).

## Возможности

- **Веб-приложение** — современный стек с Next.js 16 и React 19
- **APK для Android** — сборка нативного Android-приложения из веб-кода через Capacitor 8
- **UI-компоненты** — готовая библиотека shadcn/ui (radix-nova) с Tailwind CSS 4
- **Автоматическая тема** — дневная/ночная тема переключается по системным настройкам устройства (в том числе в Android-приложении через Capacitor)
- **Три уровня тестов** — unit-тесты (Node), реакт-тесты (jsdom) и интеграционные тесты
- **Строгий ESLint** — когнитивная сложность, цикломатика, именование, магические числа, циклические зависимости
- **Быстрый старт** — клонируй и начинай разработку сразу

## Технологии

| Технология                                                 | Назначение                                           |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| [Next.js](https://nextjs.org)                              | React-фреймворк (App Router)                         |
| [React](https://react.dev)                                 | UI-библиотека                                        |
| [TypeScript](https://www.typescriptlang.org)               | Типизация                                            |
| [Tailwind CSS](https://tailwindcss.com)                    | Утилитарный CSS-фреймворк                            |
| [shadcn/ui](https://ui.shadcn.com)                         | Библиотека готовых UI-компонентов                    |
| [Lucide React](https://lucide.dev)                         | Иконки                                               |
| [Capacitor](https://capacitorjs.com)                       | Обёртка веб-приложения в нативное Android-приложение |
| [Radix UI](https://www.radix-ui.com)                       | Безголовые (headless) примитивы для shadcn/ui        |
| [Vitest](https://vitest.dev)                               | Фреймворк для тестирования                           |
| [React Testing Library](https://testing-library.com/react) | Тестирование React-компонентов                       |
| [Prettier](https://prettier.io)                            | Форматирование кода                                  |
| [ESLint](https://eslint.org)                               | Линтер (strict preset с sonarjs, unicorn)            |

## Команды

| Команда                    | Описание                                                       |
| -------------------------- | -------------------------------------------------------------- |
| `npm run dev`              | Запуск в режиме разработки                                     |
| `npm run build`            | Сборка production-бандла (Next.js static export)               |
| `npm run serve`            | Сборка и запуск production-бандла                              |
| `npm run build-apk`        | Сборка APK (debug)                                             |
| `npm run start-apk`        | Запуск приложения на подключённом Android-устройстве/эмуляторе |
| `npm run lint`             | Проверка кода линтером                                         |
| `npm run format`           | Форматирование кода                                            |
| `npm run format-check`     | Проверка форматирования без изменений                          |
| `npm run test`             | Запуск всех unit-тестов (unit + react)                         |
| `npm run test-unit`        | Запуск unit-тестов (Node, без DOM)                             |
| `npm run test-react`       | Запуск тестов React-компонентов (jsdom)                        |
| `npm run test-integration` | Запуск интеграционных тестов                                   |
| `npm run test:watch`       | Запуск unit-тестов в watch-режиме                              |
| `npm run check-all`        | Полная проверка: тесты + сборка + линтер + формат              |

### Сборка APK

```bash
npm run build-apk
```

Готовый APK-файл будет находиться в `android/app/build/outputs/apk/debug/`.

Для сборки APK требуются:

- Java JDK 21
- Android SDK (переменная окружения `ANDROID_HOME`)

### Запуск на устройстве

```bash
npm run start-apk
```

Соберёт проект и сразу запустит на подключённом Android-устройстве или эмуляторе.

## Структура проекта

| Путь                            | Описание                                          |
| ------------------------------- | ------------------------------------------------- |
| `app/`                          | Страницы и роутинг Next.js (App Router)           |
| `app/_components/`              | Компоненты страниц (dashboard)                    |
| `components/ui/`                | UI-компоненты shadcn/ui                           |
| `components/theme-provider.tsx` | Провайдер темы (системная light/dark + Capacitor) |
| `lib/`                          | Утилиты и хелперы                                 |
| `public/`                       | Статические файлы                                 |
| `scripts/`                      | Bash-скрипты для сборки APK                       |
| `tests/unit/`                   | Unit-тесты (Node, без DOM)                        |
| `tests/react/`                  | Тесты React-компонентов (jsdom)                   |
| `tests/integration/`            | Интеграционные тесты                              |
| `android/`                      | Нативный Android-проект Capacitor                 |
| `capacitor.config.ts`           | Конфигурация Capacitor                            |
| `vitest.config.ts`              | Конфигурация unit-тестов                          |
| `vitest.react.config.ts`        | Конфигурация тестов React-компонентов             |
| `vitest.integration.config.ts`  | Конфигурация интеграционных тестов                |
| `eslint.config.mjs`             | ESLint-конфигурация (strict)                      |

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) и начинайте редактировать `app/page.tsx` — изменения отображаются мгновенно.

## Разработка с AI

Проект содержит конфигурационные файлы для AI-ассистентов:

- `AGENTS.md` — правила и ограничения для агента (Next.js 16, shadcn/ui, стиль кода, действия после изменений)
- `CLAUDE.md` — аналогичный файл для Claude-совместимых инструментов

Перед началом работы AI-агент обязан прочитать `AGENTS.md` для понимания версионных особенностей Next.js и соглашений проекта.
