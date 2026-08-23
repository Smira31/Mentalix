import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  { ignores: ['dist', 'node_modules', '.vercel', 'artifacts', 'graphify-out'] },

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,

      // Компоненты вида `<Icon />`, где Icon пришёл как проп/деструктурированный
      // параметр, а не top-level переменная — core no-unused-vars не видит их
      // использование в JSXOpeningElement и ложно ругается. Правило помечает
      // такие идентификаторы использованными.
      'react/jsx-uses-vars': 'error',

      // Существующий код местами намеренно бьёт выражения на несколько
      // строк (одна деструктурируемая переменная на строку и т.п.) —
      // Prettier так не умеет и переписал бы это в одну строку. Включать
      // 'prettier/prettier' как активное правило значит утопить реальные
      // предупреждения (хуки, unused-vars) в тысячах чисто форматных
      // разногласий. Плагин подключён ради интеграции с eslint (`lint:fix`
      // не конфликтует с `format`), само правило выключено до отдельного
      // решения о едином стиле форматирования по всему проекту.
      'prettier/prettier': 'off',

      // Правила хуков пока предупреждения, а не ошибки: в коде 25 находок,
      // и разбирать их надо осознанно, экран за экраном. Когда счётчик
      // дойдёт до нуля — поднять до 'error'.
      ...Object.fromEntries(
        Object.keys(reactHooks.configs.recommended.rules).map(r => [r, 'warn'])
      ),

      'no-empty': 'warn',

      // Слой platform — единственная точка входа в Telegram SDK.
      // Прямой импорт ломает веб-версию: там WebApp пустой, и всё,
      // что идёт мимо адаптера, тихо не работает.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@twa-dev/sdk',
              message:
                'Импортируй { platform } из ../platform. Прямой доступ к SDK разрешён только внутри src/platform/.',
            },
          ],
        },
      ],

      // Неиспользуемые переменные — предупреждение, чтобы не блокировать
      // работу. Аргументы с подчёркиванием игнорируются намеренно.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // Внутри слоя platform импорт SDK — это и есть его работа.
  {
    files: ['src/platform/**/*.js'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]
