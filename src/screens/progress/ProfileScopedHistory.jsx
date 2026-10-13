import ProgressHistory from './ProgressHistory'
import { profileScopeKey } from '../../lib/historyProfileScope'

/*
 * Профильная граница поверхности «История» в «Прогрессе».
 *
 * Ключ профиля заставляет React смонтировать состояние ProgressHistory заново
 * при смене профиля: дни, раскрытая запись и запоздавший ответ загрузки не
 * переносятся в другой профиль. Это единственная точка границы — её используют
 * и Analytics.jsx, и тестовый стенд
 * (tests/fixtures/journal-history-isolation.jsx), поэтому в стенде граница не
 * дублируется: тест проверяет ровно тот компонент, что и приложение.
 */
export default function ProfileScopedHistory({ user, ...rest }) {
  return <ProgressHistory key={profileScopeKey(user?.id)} user={user} {...rest} />
}
