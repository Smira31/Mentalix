/*
 * Относительная дата для списка разговоров: «сегодня», «вчера», «3 окт».
 * Граница дня — по МСК (как везде в проекте), не по локальному времени
 * устройства. Логика вынесена в src/lib/mskDate.js, чтобы совпадать
 * с разделителями дней в чате.
 */

import { mskRelativeListLabel } from '../../lib/mskDate'

export function relativeConversationDate(isoString, now = new Date()) {
  if (!isoString) return ''
  return mskRelativeListLabel(isoString, now)
}
