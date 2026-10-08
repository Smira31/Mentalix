/*
 * Фразы-выводы для «Итога недели».
 *
 * 6–10 шаблонов, выбор по данным. Наблюдательно, без оценок и диагнозов,
 * на «ты». Данных мало → «Неделя только набирает форму — отметь ещё
 * пару дней».
 *
 * Каждый шаблон — функция(summary) → string | null.
 * Возвращает null если данных недостаточно для этого шаблона.
 */

const MIN_DATA_DAYS = 2

/**
 * Выбирает одну фразу-вывод по данным недели.
 * @param {object} summary — результат computeWeekSummary
 * @returns {string}
 */
export function pickWeekPhrase(summary) {
  if (!summary || summary.activeDayCount < MIN_DATA_DAYS) {
    return 'Неделя только набирает форму — отметь ещё пару дней'
  }

  const candidates = [
    // 1. Самая частая вечерняя эмоция
    (s) => {
      if (!s.topEveningEmotion) return null
      const word = s.topEveningEmotion.name
      return `Чаще всего вечером ты отмечал «${word}»`
    },

    // 2. Энергия выше/ниже чем в прошлую неделю
    (s) => {
      if (s.energyTrend === '↑' && s.prevEnergyAvg != null) {
        return 'Энергия была выше, чем на прошлой неделе'
      }
      if (s.energyTrend === '↓' && s.prevEnergyAvg != null) {
        return 'Энергия была чуть ниже, чем на прошлой неделе'
      }
      return null
    },

    // 3. Настроение стабильнее / изменилось
    (s) => {
      if (s.moodTrend === '=' && s.moodAvg != null) {
        return 'Настроение держалось ровно всю неделю'
      }
      if (s.moodTrend === '↑' && s.prevMoodAvg != null) {
        return 'Настроение было выше, чем неделю назад'
      }
      return null
    },

    // 4. Самая частая практика
    (s) => {
      if (!s.topPractice || s.practiceCount < 2) return null
      return `Чаще всего ты отмечал «${s.topPractice.name}»`
    },

    // 5. Энергия в дни с практикой (если есть и чек-ины, и практики)
    (s) => {
      if (s.practiceCount > 0 && s.energyAvg != null && s.energyAvg >= 3.5) {
        return 'Энергия была выше в дни, когда ты отмечал практику'
      }
      return null
    },

    // 6. Много активных дней
    (s) => {
      if (s.activeDayCount >= 6) {
        return 'Почти каждый день ты возвращался к себе — это устойчиво'
      }
      return null
    },

    // 7. Настроение и вечерние разборы
    (s) => {
      if (s.topEveningEmotion && s.moodAvg != null && s.moodAvg >= 3.5) {
        return 'Вечерние разборы совпадали с более ровным настроением'
      }
      return null
    },

    // 8. Ровная энергия
    (s) => {
      if (s.energyTrend === '=' && s.prevEnergyAvg != null) {
        return 'Энергия держалась на одном уровне всю неделю'
      }
      return null
    },
  ]

  for (const fn of candidates) {
    const phrase = fn(summary)
    if (phrase) return phrase
  }

  // Данных достаточно (≥2 дней), но ни один шаблон не сработал
  return 'Неделя только набирает форму — отметь ещё пару дней'
}
