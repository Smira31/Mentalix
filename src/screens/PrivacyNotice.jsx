import { CloudOff, Database, Download, KeyRound, ShieldCheck, Sparkles } from 'lucide-react'

import BackButton from '../components/BackButton'

function NoticeCard({ icon: Icon, title, children }) {
  return (
    <article className="rounded-3xl border border-cream/10 bg-emerald p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
          <Icon size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-cream">{title}</h2>
          <div className="mt-2 space-y-3 text-[13px] leading-relaxed text-muted">{children}</div>
        </div>
      </div>
    </article>
  )
}

export default function PrivacyNotice({ onBack }) {
  return (
    <section className="w-full max-w-md px-5 pb-10">
      <div className="grid min-h-[42px] grid-cols-[1fr_auto_1fr] items-center">
        <div className="justify-self-start">
          <BackButton onClick={onBack} />
        </div>
        <h1 className="font-display text-[18px] text-cream">политика и данные.</h1>
        <span aria-hidden="true" />
      </div>

      <p className="mt-6 text-[14px] leading-relaxed text-muted">
        Это краткое описание текущей технической реализации Mentalix. Оно объясняет, что уже
        работает, и не заменяет юридическую политику обработки персональных данных.
      </p>

      <div className="mt-6 space-y-3">
        <NoticeCard icon={Database} title="Что сохраняется">
          <p>
            Когда ты сохраняешь действие или запись, профиль Mentalix может хранить check-in, ответы
            журнала, личные шаблоны, цели, привычки, настройки и историю диалога с наставником.
            Завершённые направленные записи хранят immutable snapshot вопросов и ответов отдельно от
            Journey и History.
          </p>
          <p>
            Фото, видео, голосовые записи, object storage и постоянные вложения сейчас не включены:
            приложение не выдаёт их за сохранённые данные.
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
            check-in и подтверждённое удаление аккаунта с owner-scoped данными. JSON export также
            содержит завершённые направленные записи с сохранёнными вопросами и ответами как
            отдельный архив — не как записи Journey или History. Markdown и CSV не являются
            эквивалентным экспортом этого архива; CSV остаётся форматом только для метрик.
          </p>
          <p>
            Удаление не обещает мгновенную очистку технических резервных копий: для неё пока нет
            отдельного опубликованного срока.
          </p>
        </NoticeCard>

        <NoticeCard icon={CloudOff} title="Черновики и синхронизация">
          <p>
            Незавершённый check-in хранится только на текущем устройстве. Это local draft, а не
            cloud backup; его можно очистить в настройках, и он не переносится автоматически.
          </p>
          <p>
            Сохранённые данные профиля могут быть доступны после связывания с web-аккаунтом, но Mini
            App не использует iCloud. Offline queue, conflict resolution и правило last-write-wins
            не реализованы и не обещаются — не редактируй одну и ту же запись параллельно в
            нескольких сессиях.
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
            Сохранённый check-in попадает в AI-контекст только при глобальном согласии и отдельном
            выборе конкретной записи. Согласие и AI-данные можно очистить отдельным действием.
          </p>
          <p>
            Чувствительные экспорт и удаление требуют положительного Telegram ID и проверенной
            Telegram-подписи. В web-версии полноценная server-side сессия владельца для таких
            действий пока не реализована, поэтому они там недоступны.
          </p>
        </NoticeCard>
      </div>

      <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-[12px] leading-relaxed text-muted">
        Если текст расходится с фактическим поведением, сообщи об этом в{' '}
        <a
          href="https://t.me/mentalix_support_bot"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-gold underline underline-offset-2"
        >
          поддержку Mentalix
        </a>
        . Мы не заявляем end-to-end encryption, iCloud backup или разрешение конфликтов, пока это не
        реализовано и не проверено.
      </div>

      <div className="mt-5 flex items-start gap-2 px-1 text-[12px] leading-relaxed text-faint">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
        <p>
          Для прав доступа используется owner-scoped доступ; границы web-авторизации описаны выше.
        </p>
      </div>
    </section>
  )
}
