import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'android/**',
    'eslint.config.mjs',
    'components/ui/**',
  ]),

  // Unicorn recommended rules
  unicorn.configs['recommended'],

  {
    plugins: {
      sonarjs,
      unicorn,
    },
    rules: {
      // Ограничение когнитивной сложности
      'sonarjs/cognitive-complexity': ['warn', 3],

      // Ограничение цикломатической сложности
      complexity: ['warn', { max: 7 }],

      // Ограничение уровней вложенности блоков
      'max-depth': ['warn', { max: 3 }],

      // Ограничение числа строк в файле (без пустых строк и комментариев)
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],

      // Ограничение строк на функцию (без пустых строк и комментариев)
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],

      // Запрет console.log и прочего мусора в продакшн-коде
      'no-console': 'warn',

      // Неиспользованные переменные и импорты
      'no-unused-vars': 'error',

      // Запрет any — заставляет думать о типах
      '@typescript-eslint/no-explicit-any': 'error',

      // Ограничение числа параметров — иначе объект или рефакторинг
      'max-params': ['warn', { max: 3 }],

      // Ограничение уровней вложенных колбэков
      'max-nested-callbacks': ['warn', { max: 3 }],

      // Магические числа — в именованные константы
      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1],
          ignoreDefaultValues: true,
          ignoreClassFieldInitialValues: true,
        },
      ],

      // Запрет мутации аргументов функции
      'no-param-reassign': 'error',

      // Бесполезный return в конце void-функции
      'no-useless-return': 'warn',

      // Фигурные скобки обязательны для if/else/for/while
      curly: 'error',

      // Типы — через import type, не через обычный import
      '@typescript-eslint/consistent-type-imports': 'warn',

      // Запрет x! — нужна нормальная проверка, не assertion
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Переменная во вложенном скопе не должна затенять внешнюю
      '@typescript-eslint/no-shadow': 'warn',

      // Единый стиль именования (только переменные и типы — без свойств)
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE'],
        },
      ],

      // Не дублировать импорты из одного модуля
      'import/no-duplicates': 'warn',

      // Пустая строка после блока импортов
      'import/newline-after-import': ['warn', { count: 1 }],

      // Запрет циклических зависимостей
      'import/no-cycle': 'error',

      // Template literals вместо конкатенации строк
      'prefer-template': 'warn',

      // Явный доступ к глобалам через window
      'no-restricted-globals': [
        'warn',
        { name: 'event', message: 'Use the parameter passed to the handler instead.' },
        { name: 'location', message: 'Use window.location instead.' },
      ],

      // Все ветки должны возвращать значение или ни одна
      'consistent-return': 'error',

      // --- Потенциальные баги ---

      // Код после return/throw — недостижим
      'no-unreachable': 'error',

      // Сравнение с собой — опечатка при копипасте
      'no-self-compare': 'error',

      // '${name}' в обычной строке — забыли бэктики
      'no-template-curly-in-string': 'error',

      // Пропущенные элементы в массиве [1,,3]
      'no-sparse-arrays': 'error',

      // throw 'message' вместо throw new Error()
      'no-throw-literal': 'error',

      // cond ? true : false — лишний тернарник
      'no-unneeded-ternary': 'error',

      // Условие-константа — всегда true или false
      'no-constant-binary-expression': 'error',

      // --- Читаемость ---

      // Тернарник в тернарнике — нечитаемо
      'no-nested-ternary': 'error',

      // else после return — лишний отступ
      'no-else-return': 'error',

      // Одинокий if внутри else — инвертируй условие
      'no-lonely-if': 'warn',

      // Пустые функции — забыли реализовать
      'no-empty-function': 'error',

      // Пустой constructor() {} — не нужен
      'no-useless-constructor': 'error',

      // --- Асинхронщина ---

      // async без await внутри — бессмысленно
      'require-await': 'error',

      // new Promise(async ...) — антипаттерн
      'no-async-promise-executor': 'error',

      // --- React ---

      // Фрагмент вокруг одного элемента
      'react/jsx-no-useless-fragment': 'warn',

      // <Comp></Comp> → <Comp />
      'react/self-closing-comp': 'warn',

      // disabled={true} → disabled
      'react/jsx-boolean-value': 'warn',
    },
  },

  // Слабее для тестов — там магические числа и console норма
  {
    files: ['**/*.test.*', '**/*.spec.*', '**/tests/**'],
    rules: {
      'no-magic-numbers': 'off',
      'no-console': 'off',
      'max-lines-per-function': 'off',
    },
  },

  // ВАЖНО: всегда последним
  prettier,
])

export default eslintConfig
