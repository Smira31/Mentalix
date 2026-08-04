import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  { ignores: ['dist', 'node_modules'] },

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
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,

      // Правила хуков пока предупреждения, а не ошибки: в коде 25 находок,
      // и разбирать их надо осознанно, экран за экраном. Когда счётчик
      // дойдёт до нуля — поднять до 'error'.
      ...Object.fromEntries(
        Object.keys(reactHooks.configs.recommended.rules).map((r) => [r, 'warn']),
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
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' },
      ],
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
