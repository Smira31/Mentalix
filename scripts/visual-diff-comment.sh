#!/usr/bin/env bash
# Генерирует и публикует комментарий в PR с описанием визуальных отличий.
# Читает artifacts/ux-check/visual-diffs.json, копирует эталоны для изменённых
# экранов в artifacts/ux-check/baselines/ и оставляет комментарий через gh CLI.
set -euo pipefail

DIFFS_FILE="artifacts/ux-check/visual-diffs.json"

if [ ! -f "$DIFFS_FILE" ]; then
  echo "visual-diffs.json не найден — комментарий не нужен"
  exit 0
fi

DIFF_COUNT=$(jq '.diffs | length' "$DIFFS_FILE" 2>/dev/null || echo "0")

if [ "$DIFF_COUNT" = "0" ]; then
  echo "Визуальных диффов нет — комментарий не нужен"
  exit 0
fi

# Копируем эталоны (было) рядом с актуальными скриншотами (стало) для удобства.
mkdir -p artifacts/ux-check/baselines
while IFS= read -r slug; do
  IFS='|' read -r viewport s <<< "$(jq -r --arg slug "$slug" '.diffs[] | select(.slug == $slug) | "\(.viewport)|\(.slug)"' "$DIFFS_FILE" | head -1)"
  for pattern in "${viewport}-${s}-linux.png" "${viewport}-${s}-starter-enabled-linux.png"; do
    baseline="tests/ux/ux-check.spec.mjs-snapshots/${pattern}"
    if [ -f "$baseline" ]; then
      cp "$baseline" "artifacts/ux-check/baselines/"
    fi
  done
done < <(jq -r '.diffs[].slug' "$DIFFS_FILE" | sort -u)

# Копируем diff-изображения из Playwright outputDir, если они есть.
if [ -d artifacts/ux-check/playwright-output ]; then
  mkdir -p artifacts/ux-check/diffs
  find artifacts/ux-check/playwright-output -name '*diff*' -o -name '*actual*' -o -name '*expected*' 2>/dev/null | while read -r f; do
    cp "$f" artifacts/ux-check/diffs/ 2>/dev/null || true
  done
fi

# Формируем тело комментария.
ARTIFACT_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${RUN_ID}"

COMMENT_BODY=$(jq -r --arg url "$ARTIFACT_URL" --arg count "$DIFF_COUNT" '
  "## 📸 Визуальные отличия от эталонов main\n\nОбнаружены отличия на **\($count)** экранах.\nДопуск: `maxDiffPixelRatio 0.01`. Статус: нейтральный, мерж не блокирует.\n\n| Экран | Viewport | Было / Стало |\n| --- | --- | --- |\n" +
  ([.diffs[] | "| \(.screen) | \(.viewport) | `baselines/\(.viewport)-\(.slug)-linux.png` ↔ `\(.actual)` |"] | join("\n")) +
  "\n\n📁 **Изображения было/стало/diff** доступны в [артефактах workflow](\($url)) — раздел *visual-snapshots*.\n\n> Если изменения ожидаемы — после мержа в main эталоны перегенерируются автоматически.\n\n---\n_Автоматический комментарий visual snapshots check._"
' "$DIFFS_FILE")

# Публикуем комментарий.
gh pr comment "$PR_NUMBER" --body "$COMMENT_BODY"
echo "Комментарий с визуальными отличиями опубликован в PR #$PR_NUMBER"
