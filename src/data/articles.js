// ── Статьи Библиотеки ──
//
// Тексты статей загружаются с сервера (#1112, этап 3):
//   GET /api/content/library          — список без body
//   GET /api/content/library/{id}     — статья целиком
//
// В демо-режиме (?demo=1) используются встроенные демо-статьи
// (src/data/demoContent.js, DEMO_ARTICLES).
//
// Поля статьи (server-формат, camelCase):
//   id, title, excerpt, minutes, date, tag?, source?, question?, body

export const ARTICLES = []
