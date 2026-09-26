import { api } from '../../lib/api'
import { readLocal, writeLocal } from '../../lib/store'
import { cloud } from '../../platform/telegram.hooks'
import { toLocalCalendarDate } from '../../lib/dateTimezonePolicy'
import { deriveConclusions, MIN_CHECKINS } from '../Analytics'
import { insightIntervalElapsed } from './surpriseRules'

// ── «Дайджест от Следопыта» (ROADMAP.md, идея 3) ──
//
// Реплика рождается целиком на фронте: та же deriveConclusions, что
// считает находки для «Тренды» в Analytics.jsx, только вставляется
// перед первым сообщением при обычном входе в диалог с dnevnik.
// Ничего не отправляется в backend — при следующей загрузке истории
// с сервера сообщение исчезает само, это ожидаемо.

const INSIGHT_SEEN_KEY = 'mx-insight-seen'
export const SURPRISE_MESSAGE_KEY = 'mx-surprise-insight-message'

/*
 * Дата последнего показа — как readSeenEverywhere/writeSeen в
 * Achievements.jsx (локально + в облаке, mx-badges-seen), но вместо
 * множества id хранится одна ISO-дата: при расхождении между
 * устройствами берётся более поздняя, а не объединение множеств.
 */
export async function readLastInsightDate() {
  const local = readLocal(INSIGHT_SEEN_KEY)
  const remote = await cloud.get(INSIGHT_SEEN_KEY)
  const dates = [local, remote].filter(Boolean)

  if (!dates.length) return null

  return dates.sort().at(-1)
}

export function writeInsightSeen(dateIso) {
  writeLocal(INSIGHT_SEEN_KEY, dateIso)
  cloud.set(INSIGHT_SEEN_KEY, dateIso)
}

function todayIso() {
  return toLocalCalendarDate()
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

    if (!insightIntervalElapsed(lastDate, todayIso())) {
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
