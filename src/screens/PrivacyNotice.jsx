import {
  ChevronDown,
  CloudOff,
  Database,
  Download,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { ProfilePage } from './settings/ProfileUi'
import { SUPPORT_TELEGRAM_URL, openSupportChat } from '../lib/support'

// Раздел — строка с заголовком; текст раскрывается по тапу (§5.4, по умолчанию свёрнут).
function NoticeCard({ icon: Icon, title, children }) {
  return (
    <details className="mx-profile-disclosure" data-testid="privacy-section">
      <summary className="mx-profile-disclosure__summary">
        <Icon size={18} aria-hidden="true" className="mx-profile-disclosure__icon" />
        <span className="mx-profile-disclosure__title">{title}</span>
        <ChevronDown size={16} aria-hidden="true" className="mx-profile-disclosure__chevron" />
      </summary>
      <div className="mx-profile-disclosure__body space-y-3 text-[13px] leading-relaxed text-muted">
        {children}
      </div>
    </details>
  )
}

export default function PrivacyNotice({ onBack }) {
  return (
    <ProfilePage title="политика и данные." onBack={onBack} testId="profile-screen-privacy">
      <section className="w-full px-[var(--mx-screen-x)]">
        <p className="text-[14px] leading-relaxed text-muted">
          Это краткое описание того, как Mentalix сейчас хранит данные. Оно объясняет, что уже
          работает, и не заменяет юридическую политику обработки персональных данных.
        </p>

        <div className="mx-profile-card mt-6">
          <NoticeCard icon={Database} title="Что сохраняется">
            <p>
              Когда ты сохраняешь действие или запись, профиль Mentalix может хранить чек-ин, ответы
              журнала, личные шаблоны, цели, привычки, настройки и историю диалога с наставником.
              Завершённые направленные записи хранят неизменяемую копию вопросов и ответов отдельно
              от пути и истории.
            </p>
            <p>
              Фото, видео, голосовые записи, хранилище файлов и постоянные вложения сейчас не
              включены: приложение не выдаёт их за сохранённые данные.
            </p>
          </NoticeCard>

          <NoticeCard icon={Download} title="Срок хранения и твой контроль">
            <p>
              Автоматический срок удаления сохранённых серверных данных сейчас не настроен. До
              удаления данные остаются в активном профиле, поэтому не называются временными или
              анонимными.
            </p>
            <p>
              В Telegram Mini App с проверенной подписью доступны экспорт, удаление отдельного
              чек-ина и подтверждённое удаление аккаунта со всеми твоими данными. Экспорт в JSON
              также содержит завершённые направленные записи с сохранёнными вопросами и ответами как
              отдельный архив — не как записи пути или истории. Markdown и CSV не являются
              эквивалентным экспортом этого архива; CSV остаётся форматом только для метрик.
            </p>
            <p>
              Удаление не обещает мгновенную очистку технических резервных копий: для неё пока нет
              отдельного опубликованного срока.
            </p>
          </NoticeCard>

          <NoticeCard icon={CloudOff} title="Черновики и синхронизация">
            <p>
              Незавершённый чек-ин хранится только на текущем устройстве. Это черновик на
              устройстве, а не резервная копия в облаке; его можно очистить в настройках, и он не
              переносится автоматически.
            </p>
            <p>
              Сохранённые данные профиля могут быть доступны после связывания с аккаунтом на сайте,
              но Mini App не использует iCloud. Очередь без сети, разрешение конфликтов и правило
              «побеждает последняя запись» пока не сделаны и не обещаются — не редактируй одну и ту
              же запись параллельно в нескольких сессиях.
            </p>
          </NoticeCard>

          <NoticeCard icon={KeyRound} title="Блокировка не является шифрованием">
            <p>
              Код доступа и Face ID/Touch ID, если доступны, создают локальный экранный барьер на
              устройстве. Они не шифруют серверные данные и не заменяют защиту аккаунта Telegram.
            </p>
            <p>
              PIN хранится локально, поэтому на новом устройстве блокировку при необходимости надо
              настроить заново.
            </p>
          </NoticeCard>

          <NoticeCard icon={Sparkles} title="AI и проверка доступа">
            <p>
              Сохранённый чек-ин попадает в AI-контекст только при глобальном согласии и отдельном
              выборе конкретной записи. Согласие и AI-данные можно очистить отдельным действием.
            </p>
            <p>
              Чувствительные экспорт и удаление требуют положительного Telegram ID и проверенной
              Telegram-подписи. В веб-версии полноценного входа на сервере для таких действий пока
              нет, поэтому они там недоступны.
            </p>
          </NoticeCard>
        </div>

        <div className="mt-6 rounded-2xl border border-[rgb(var(--c-border))] p-4 text-[12px] leading-relaxed text-muted">
          Если текст расходится с фактическим поведением, сообщи об этом в{' '}
          <a
            href={SUPPORT_TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            onClick={openSupportChat}
            className="font-semibold text-cream underline underline-offset-2"
          >
            поддержку Mentalix
          </a>
          . Мы не заявляем сквозное шифрование, резервную копию в iCloud или разрешение конфликтов,
          пока это не реализовано и не проверено.
        </div>

        <div className="mt-5 flex items-start gap-2 px-1 text-[12px] leading-relaxed text-faint">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <p>Каждый видит только свои данные; ограничения входа на сайте описаны выше.</p>
        </div>
      </section>
    </ProfilePage>
  )
}
