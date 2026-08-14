import { api } from '../../lib/api'
import { readLocal, writeLocal } from '../../lib/store'
import { cloud } from '../../platform/telegram.hooks'
import { deriveConclusions, MIN_CHECKINS } from '../Analytics'

// ── «Дайджест от Следопыта» (ROADMAP.md, идея 3) ──
//
// Реплика рождается целиком на фронте: та же deriveConclusions, что
// считает находки для «Тренды» в Analytics.jsx, только вставляется
// перед первым сообщением при обычном входе в диалог с dnevnik.
// Ничего не отправляется в backend — при следующей загрузке истории
// с сервера сообщение исчезает само, это ожидаемо.

const INSIGHT_SEEN_KEY = 'mx-insight-seen'
const MIN_DAYS_BETWEEN_INSIGHTS = 4

/*
 * Дата последнего показа — как readSeenEverywhere/writeSeen в
 * Achievements.jsx (локально + в облаке, mx-badges-seen), но вместо
 * множества id хранится одна ISO-дата: при расхождении между
 * устройствами берётся более поздняя, а не объединение множеств.
 */
async function readLastInsightDate() {
  const local = readLocal(INSIGHT_SEEN_KEY)
  const remote = await cloud.get(INSIGHT_SEEN_KEY)
  const dates = [local, remote].filter(Boolean)

  if (!dates.length) return null

  return dates.sort().at(-1)
}

function writeInsightSeen(dateIso) {
  writeLocal(INSIGHT_SEEN_KEY, dateIso)
  cloud.set(INSIGHT_SEEN_KEY, dateIso)
}

function daysSince(dateIso) {
  const then = new Date(`${dateIso}T00:00:00`)
  const now = new Date()

  return (now - then) / (1000 * 60 * 60 * 24)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/*
 * Возвращает синтетическое сообщение-реплику Следопыта или null,
 * если показывать нечего: рано (< 4 дней с прошлого раза), данных
 * мало (< MIN_CHECKINS чек-инов — та же отсечка, что у самого
 * «Главного вывода» в Analytics.jsx) или значимых находок не нашлось.
 */
export async function maybeBuildInsightMessage(user) {
  try {
    const lastDate = await readLastInsightDate()

    if (lastDate && daysSince(lastDate) < MIN_DAYS_BETWEEN_INSIGHTS) {
      return null
    }

    const [data, checkins] = await Promise.all([
      api.analytics.get(user.id, 14).catch(() => null),
      api.checkin.history(user.id, 14).catch(() => []),
    ])

    if (!checkins || checkins.length < MIN_CHECKINS) {
      return null
    }

    const found = deriveConclusions(checkins, data)

    if (!found.length) {
      return null
    }

    writeInsightSeen(todayIso())

    return {
      role: 'assistant',
      content: `Кое-что заметил, пока смотрел твои дни. ${found[0].text}`,
    }
  } catch (error) {
    console.error(error)
    return null
  }
}
