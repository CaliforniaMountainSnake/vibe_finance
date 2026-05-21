<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Code

### Действия после внесения любых изменений в кодовую базу

- Удостовериться, что линтер (`npm run lint`) не выдает ошибок.
- Прогнать юнит-тесты (`npm run test`).
- Выполнить форматирование (`npm run format`).

## UI

- В проекте используется `shadcn/ui` как готовая библиотека компонентов.
- Ты НЕ имеешь права переписывать или переизобретать её компоненты.
- Не создавай свои версии компонентов из `shadcn/ui`.
- Если компонент уже есть в `shadcn/ui` — используй его.
- Не копируй код компонентов в новые файлы.
- Не заменяй shadcn компоненты кастомным Tailwind-кодом.
- Не делай "улучшенные" абстракции поверх них.
- Не изменяй имеющиеся компоненты без прямого указания.
