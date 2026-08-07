// ──────────────────────────
// Экран «Сегодня» / Главный дашборд
//
// Этот компонент отвечает за ежедневный сценарий:
// лента недели → первое действие дня → чек-ин состояния.
// Навигация реализована через локальное состояние sub,
// а возврат даёт нативная кнопка Telegram.
// ──────────────────────────

import { useEffect, useState } from "react";
import { platform } from "../platform";
import { api } from "../lib/api";
import {
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

import Path from "./Path";
import CheckIn from "./CheckIn";
import ThemeScreen from "./ThemeScreen";
import { DayArc } from "../components/Motif";
import BackButton from "../components/BackButton";
import History from "./History";
import QuoteView from "./QuoteView";
import MorningPilotCard from "../components/MorningPilotCard";

function WeekStrip() {
  const names = ["Вс", "Пн", "Вт", "Ср", "Чт", "Фт", "Сб"];

  // [DESIGN SYSTEM]: text-[12px] -> text-faint
  return (
    <div className="flex justify-between w-full mb-4">
      {[...Array(7).keys()]
        .map((index) => {
          const day = new Date();
          day.setDate(day.getDate() - ((day.getDay() + 6) % 7) + index);
          const isToday =
            day.toDateString() === new Date().toDateString();

          return (
            <div
              key={day.getTime()}
              className={`w-11 py-2 rounded-2xl font-semibold ${
                isToday ? "border border-text" : ""
              } flex items-center gap-1 justify-center`}
            >
              {/* Дни недели */}
              <span className="text-faint uppercase">{names[day.getDay()]}</span>
              {/* Число месяца */}
              <b className="text-sm text-cream leading-none">
                {day.getDate()}
              </b>
            </div>
          );
        })}
    </div>
  );
}

export default function Today({
  user,
  onOpenPractice,
  onGoMentor,
  onFlowChange,
}) {
  const [rituals, setRituals] = useState([]);
  const [ascezas, setAscezas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [checkin, setCheckin] = useState(null);
  const [reviewHour, setReviewHour] = useState(19);
  const [theme, setTheme] = useState(null);
  const [activeToday, setActiveToday] = useState(null);
  const [sub, setSub] = useState(null); // Вложенный экран
  const [pathTab, setPathTab] = useState("path"); // path | history

  /* Логика вложенных сценариев */
  function changeSub(nextSub) {
    onFlowChange?.(Boolean(nextSub));
    setSub(nextSub);
  }

  useEffect(() => () => onFlowChange?.(false), [onFlowChange]);

  async function refreshCheckin() {
    if (!user) return;
    try {
      setCheckin(await api.checkin.today(user.id));
    } catch {}
  }

  useEffect(() => {
    if (!user || sub !== null) return;

    ;(async () => {
      try {
        const [
          ritualsData,
          ascezasData,
          quoteData,
          checkinData,
          themesData,
          settingsData,
        ] = await Promise.all([
          api.rituals.list(user.id),
          api.ascezas.list(user.id),
          api.quotes.today(user.id),
          api.checkin.today(user.id).catch(() => null),
          api.themes.list(user.id).catch(() => []),
          api.profile.getSettings(user.id).catch(() => null),
        ]);

        setTheme(themesData[0] ?? null);
        setRituals(ritualsData);
        setAscezas(ascezasData);
        setDailyQuote(quoteData?.text);
        setCheckin(checkinData);
        setReviewHour(settingsData?.review_hour ?? 19);

        api.pulse.today()
          .then(pulse => setActiveToday(pulse.active_today))
          .catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, [user, sub]);

  // [ARCHITECTURE]: Safe Areas and Platform Layer
  // Подключаем fullscreenSurface только при необходимости
  if (sub === "checkin") platform.useFullscreenSurface(true, () => {});

  // Состояние экрана
  const hourNow = new Date().getHours();
  const todayState =
    checkin?.review_completed_at
      ? "dayClosed"
      : hourNow >= reviewHour
      ? "reviewPending"
      : checkin
      ? "dayInProgress"
      : "checkinPending";

  // Данные для карточки героя
  const total = rituals.length + ascezas.length;
  const done =
    rituals.filter(r => r.today_level).length +
    ascezas.filter(a => a.today_status).length;
  const pct = Math.round(total > 0 ? (done / total) * 100 : 0);
  const next = deriveNextAction({ rituals, ascezas });
  const remainAfter = Math.max(
    rituals.filter(r => !r.today_level).length +
      ascezas.filter(a => !a.today_status).length -
      1,
    0
  );

  // Карточка героя (Дуга дня)
  // [DESIGN SYSTEM]: bg-artbed -> rgb(var(--c-artbed))
  const heroArt = (
    <div className="w-full rounded-[28px] overflow-hidden mb-5 py-2" style={{ backgroundColor: "rgb(var(--c-artbed))" }}>
      <DayArc
        state={isEmpty ? "empty" : todayState}
        done={done}
        total={total}
        className="w-full max-w-[300px] h-[150px] mx-auto text-gold"
      />
    </div>
  );

  // Утренний пилот вынесен в отдельный компонент
  return loading ? (
    <p className="text-muted text-sm px-6 pt-8">Загрузка...</p>
  ) : sub === "checkin" ? (
    <CheckIn
      user={user}
      existing={checkin}
      mode={
        todayState === "reviewPending" ||
        todayState === "dayClosed"
          ? "evening"
          : "checkin"
      }
      onDone={() => {
        void refreshCheckin();
        changeSub(null);
      }}
    />
  ) : sub === "theme" && theme ? (
    <ThemeScreen user={user} themeId={theme.id} onBack={() => changeSub(null)} />
  ) : sub === "quote" ? (
    <QuoteView user={user} todayQuote={dailyQuote} onClose={() => changeSub(null)} />
  ) : sub === "path" ? (
    <div className="w-full animate-fade-in">
      <div className="w-full max-w-md px-5 pt-4 pb-3 flex items-center gap-3">
        <BackButton onClick={() => changeSub(null)} />
        <div className="bg-card p-1 rounded-full flex-1 flex">
          {["path", "history"].map(key => (
            <button
              key={key}
              onClick={() => {
                platform.haptic("light");
                setPathTab(key);
              }}
              className={`py-2 rounded-full text-[13px] font-bold transition-colors ${
                pathTab === key
                  ? "bg-cream/10 text-cream"
                  : "bg-transparent text-muted"
              }`}
            >
              {key === "path" ? "Путь" : "История"}
            </button>
          ))}
        </div>
      </div>
      {pathTab === "path" ? (
        <Path user={user} />
      ) : (
        <div className="w-full max-w-md px-5">
          <History user={user} />
        </div>
      )}
    </div>
  ) : (
    <>
      <div className="w-full max-w-md px-5">
        <WeekStrip />

        {/* Утренняя карточка */}
        <MorningPilotCard
          rituals={rituals}
          todayState={todayState}
          isEmpty={total === 0}
          next={next}
          onOpenRituals={() =>
            onOpenPractice("rituals")
          }
        />

        {/* Герой-карточка */}
        <div className="rounded-[32px] px-6 py-7 text-center flex flex-col justify-center" style={{ backgroundColor: "rgb(var(--c-card))" }}>
          {heroArt}

          {(checkinAsHero || todayState === "dayClosed") && (
            <>
              <div className="text-[13px] font-semibold mb-2 text-faint">
                {todayState === "reviewPending" ? "Анализ дня" : "Сегодня"}
              </div>
              <h2 className="font-display text-[28px] leading-tight text-cream">
                {todayState === "reviewPending"
                  ? "Разобрать день?"
                  : todayState === "dayClosed"
                  ? "День закрыт"
                  : "Как ты?"}
              </h2>
              <p className="text-[14px] mt-2 text-muted">
                {todayState === "reviewPending"
                  ? "Уроки и то, чем стоит гордиться"
                  : todayState === "dayClosed"
                  ? "Вечерний разбор завершён"
                  : "Короткий чек-ин состояния"}
              </p>

              {todayState === "reviewPending" && (
                <div className="w-full max-w-sm mx-auto mt-5 space-y-2 text-left">
                  {[
                    "Что получилось?",
                    "Что было трудно?",
                    "Какой вывод забираешь?",
                  ].map(question => (
                    <div
                      key={question}
                      className="rounded-2xl px-4 py-2.5 text-[12px] text-faint"
                      style={{
                        backgroundColor: "rgba(var(--c-artbed))"
                      }}
                    >
                      {question}
                    </div>
                  ))}
                  <span className="text-[11px] text-gold font-semibold px-1 pt-1">
                    + три вещи, которыми гордишься
                  </span>
                </div>
              )}

              <button
                onClick={() => {
                  platform.haptic("medium");
                  changeSub("checkin");
                }}
                className="cta-pill text-[16px] px-9 py-4 mx-auto mt-7"
              >
                {todayState === "reviewPending"
                  ? "Разобрать день"
                  : todayState === "dayClosed"
                  ? "Открыть разбор снова"
                  : "Пройти чек-ин"}
              </button>

              {next && (
                <p className="text-[12px] text-faint mt-5">Дальше: {next.title}</p>
              )}
            </>
          )}

          {!checkinAsHero &&
            !isEmpty && (
              <>
                <div className="text-[13px] font-semibold mb-2 text-faint">
                  {next ? "Самое важное" : "Путь продолжается"}
                </div>
                <h2 className="font-display text-[28px] leading-tight text-cream">
                  {next?.title ?? "Сегодня ты выше, чем вчера"}
                </h2>
                <p className="text-[14px] mt-2 text-muted">
                  {next?.meta ?? "Все практики закрыты"}
                </p>
                <button
                  onClick={() => {
                    platform.haptic("medium");
                    if (next) {
                      onOpenPractice(next.sub);
                    } else {
                      onGoMentor();
                    }
                  }}
                  className="cta-pill text-[16px] px-9 py-4 mx-auto mt-7"
                >
                  {next ? "Начать" : "Поговорить с наставником"}
                </button>
                {remainAfter > 0 && (
                  <p className="text-[12px] text-faint mt-5">
                    После этого останется:{" "}
                    {remainAfter}
                  </p>
                )}
              </>
            )}

          {!checkinAsHero && isEmpty && (
            <>
              <div className="text-[13px] font-semibold mb-2 text-faint">
                Твой путь ждёт
              </div>
              <h2 className="font-display text-[26px] leading-tight text-cream">
                Добавь первый ритуал
              </h2>
              <p className="text-[14px] mt-2 text-muted">
                Система работает через регулярность —
                начни с одного
              </p>
              <button
                onClick={() => {
                  platform.haptic("medium");
                  onOpenPractice("rituals");
                }}
                className="cta-pill text-[16px] px-9 py-4 mx-auto mt-7"
              >
                Начать
              </button>
            </>
          )}
        </div>

        {/* Пульс сообщества */}
        {activeToday !== null && activeToday > 1 && (
          <p className="text-center text-[12px] text-faint font-sembold mt-4">
            {activeToday < 20
              ? `Сегодня в пути вместе с тобой: ${activeToday}`
              : `Сегодня свой путь продолжили ${activeToday.toLocaleString(
                  "ru-RU",
                )} человек`}
          </p>
        )}

        {/* Проверка чекина */}
        {checkinDone && (
          <button
            onClick={() => {
              platform.haptic("light");
              changeSub("checkin");
            }}
            className="w-full rounded-3xl px-5 py-4 mt-4 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: "rgba(var(--c-card), 0.6)",
            }}
          >
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                color: "var(--c-gold)",
                backgroundColor: "rgba(var(--c-gold), 0.1)"
              }}
            >
              ✓
            </span>
            <span className="flex-1 text-left">
              <span className="block text-[14px] font-bold text-cream">
                {todayState === "dayClosed"
                  ? "День разобран"
                  : "Чек-ин выполнен"}
              </span>
              <span className="block text-[12px] text-muted font-medium">
                {checkin.emotion
                  ? `${checkin.emotion} · `
                  : ""}
                настроение:{" "}
                {MOOD_WORDS[(checkin.mood || 3) - 1]}
              </span>
            </span>
            <span className="text-[12px] font-semibold text-faint shrink-0">
              изменить
            </span>
          </button>
        )}

        {/* Полоса дня */}
        {!isEmpty && (
          <button
            onClick={() => {
              platform.haptic("light");
              setPathTab("history");
              changeSub("path");
            }}
            className="w-full rounded-3xl px-5 py-4 mt-4 flex items-center gap-3 border-0 active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: "var(--c-card)",
            }}
          >
            <ArrowUpRight
              size={18}
              strokeWidth={2}
              className="text-gold shrink-0"
            />
            <span className="text-[14px] font-bold text-cream whitespace-nowrap">
              День
            </span>
            <div
              className="h-[5px] rounded-full bg-cream/10 overflow-hidden flex-1"
              style={{
                backgroundColor: "rgba(var(--c-line), 0.1)" // Основной цвет линии
              }}
            >
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{
                  width: `${pct}%`
                }}
              />
            </div>
            <span className="text-[13px] font-bold text-gold whitespace-nowrap">
              {done} из {total}
            </span>
            <ChevronRight
              size={18}
              className="text-faint shrink-0"
            />
          </button>
        )}

        {/* Тема недели */}
        {theme && (
          <button
            onClick={() => {
              platform.haptic("light");
              changeSub("theme");
            }}
            className="w-full rounded-[28px] px-6 py-7 mt-4 text-center border-0 active:scale-[0.99] transition-transform animate-fade-in"
            style={{
              backgroundColor: "var(--c-card)"
            }}
          >
            <span className="block text-[11px] text-faint font-bold uppercase tracking-wider mb-2">
              Тема недели
            </span>
            <span className="block font-display text-[22px] text-cream lowercase leading-tight">
              {theme.title}
            </span>
            <span className="block text-[13px] text-muted mt-2 leading-snug">
              {theme.subtitle}
            </span>
            <span className="flex items-center justify-center gap-1.5 mt-4">
              {Array.from({ length: theme.total_days }).map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: i < theme.reflected_days
                      ? "var(--c-gold)"
                      : "rgba(var(--c-cream), 0.1)"
                  }}
                />
              ))}
            </span>
            <span className="block text-[12px] text-faint font-semibold mt-3">
              {theme.reflected_days > 0
                ? `Пройдено дней: ${theme.reflected_days} из ${theme.total_days}`
                : "Начать неделю"}
            </span>
          </button>
        )}

        {/* Мысль дня */}
        {dailyQuote && (
          <button
            onClick={() => {
              platform.haptic("light");
              changeSub("quote");
            }}
            className="w-full rounded-[28px] px-6 py-8 mt-4 text-center animate-fade-in border-0 active:scale-[0.99] transition-transform"
            style={{
              backgroundColor: "var(--c-card)"
            }}
          >
            <span className="block text-[12px] text-muted font-semibold mb-3">
              Мысль дня
            </span>
            <span className="block font-display text-[19px] text-cream leading-snug">
              {dailyQuote}
            </span>
            <span className="block text-[11px] text-faint font-semibold mt-4">
              открыть все →
            </span>
          </button>
        )}
      </div>
