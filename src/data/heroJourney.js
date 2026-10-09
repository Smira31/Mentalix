import uncertaintyEnter from '../assets/hero-journey/uncertainty-enter.webp'
import uncertaintyDone from '../assets/hero-journey/uncertainty-done.webp'
import temporalityEnter from '../assets/hero-journey/temporality-enter.webp'
import temporalityDone from '../assets/hero-journey/temporality-done.webp'
import choiceEnter from '../assets/hero-journey/choice-enter.webp'
import choiceDone from '../assets/hero-journey/choice-done.webp'
import abundanceEnter from '../assets/hero-journey/abundance-enter.webp'
import abundanceDone from '../assets/hero-journey/abundance-done.webp'
import comparisonEnter from '../assets/hero-journey/comparison-enter.webp'
import comparisonDone from '../assets/hero-journey/comparison-done.webp'
import mirrorEnter from '../assets/hero-journey/mirror-enter.webp'
import mirrorDone from '../assets/hero-journey/mirror-done.webp'
import lonelinessEnter from '../assets/hero-journey/loneliness-enter.webp'
import lonelinessDone from '../assets/hero-journey/loneliness-done.webp'
import relationshipsEnter from '../assets/hero-journey/relationships-enter.webp'
import relationshipsDone from '../assets/hero-journey/relationships-done.webp'
import lostSupportsEnter from '../assets/hero-journey/lost-supports-enter.webp'
import lostSupportsDone from '../assets/hero-journey/lost-supports-done.webp'
import ageCrisesEnter from '../assets/hero-journey/age-crises-enter.webp'
import ageCrisesDone from '../assets/hero-journey/age-crises-done.webp'
import meaningEnter from '../assets/hero-journey/meaning-enter.webp'
import meaningDone from '../assets/hero-journey/meaning-done.webp'
import selfAssemblyEnter from '../assets/hero-journey/self-assembly-enter.webp'
import selfAssemblyDone from '../assets/hero-journey/self-assembly-done.webp'
import infoPressureEnter from '../assets/hero-journey/info-pressure-enter.webp'
import infoPressureDone from '../assets/hero-journey/info-pressure-done.webp'
import hasteEnter from '../assets/hero-journey/haste-enter.webp'
import hasteDone from '../assets/hero-journey/haste-done.webp'
import othersLivesEnter from '../assets/hero-journey/others-lives-enter.webp'
import othersLivesDone from '../assets/hero-journey/others-lives-done.webp'
import digitalAvatarEnter from '../assets/hero-journey/digital-avatar-enter.webp'
import digitalAvatarDone from '../assets/hero-journey/digital-avatar-done.webp'

/**
 * Путь героя — авторский курс Mentalix.
 * Основа: общие идеи мономифа (Дж. Кэмпбелл) и аналитической психологии (К. Г. Юнг).
 *
 * Курс: 16 шагов в 4 главах + финал «Возвращение».
 * 6 стадий пути героя (Кэмпбелл / Юнг) и слои личности по Юнгу
 * сохранены для следующих экранов.
 */

// ── 6 стадий пути героя (по Кэмпбеллу / Юнгу) ──

export const HERO_JOURNEY_STAGES = [
  {
    key: 'call',
    title: 'Зов',
    subtitle: 'Обнаружение потенциала',
    description:
      'Живёшь себе — и вдруг замечаешь в себе что-то новое: талант, способность, возможность. Или кризис обрывает привычный ход. Это не трагедия, а приглашение.',
  },
  {
    key: 'threshold',
    title: 'Порог',
    subtitle: 'Принятие вызова',
    description:
      'Судьба говорит: у тебя есть потенциал, который нужно реализовать. Кто-то принимает вызов, кто-то отказывается. Отказ не отменяет кризис — он только откладывает встречу с собой.',
  },
  {
    key: 'trials',
    title: 'Испытания',
    subtitle: '16 соблазнов и проверок',
    description:
      'На пути нас встречают испытания — неопределённость, одиночество, потеря смысла. Каждое можно пройти или отступить. Отступление формирует долг, который потом догоняет.',
  },
  {
    key: 'death',
    title: 'Смерть Эго',
    subtitle: 'Гибель прежнего себя',
    description:
      'Не физическая смерть, а гибель прежнего образа себя. Роль, идентификация, образ будущего — всё рушится. Здесь начинается настоящая трансформация.',
  },
  {
    key: 'rebirth',
    title: 'Возрождение',
    subtitle: 'Обретение самости',
    description:
      'Из точки гибели вырастает новое понимание себя. Не сборка по кусочкам, а рост из единого центра — самости. То, что в религиях называют душой, в психологии — подлинным «я».',
  },
  {
    key: 'return',
    title: 'Возвращение',
    subtitle: 'Награда пути',
    description:
      'Ты возвращаешься в тот же мир, но уже обогащённый новым знанием и опытом. Это знание — награда пути героя. Свет, который можно разделить с другими.',
  },
]

// ── 16 шагов курса (порядок = номер шага 1–16) ──

export const HERO_JOURNEY_TRIALS = [
  {
    id: 'uncertainty',
    number: 1,
    title: 'Неопределённость',
    subtitle: 'Будущее стало мгновенным',
    description:
      'Будущее покрыто туманом. Множество процессов не контролируются, драматические изменения происходят постоянно. Можно закрыть глаза, уйти в отказ — или ощутить силу внутри и совершить прыжок веры.',
    prompt: 'Что сейчас скрыто туманом и не поддаётся контролю?',
    action: 'Назови одну вещь, которая зависит от тебя, несмотря на неопределённость.',
    shadowAction:
      'Уход в отказ: «меня это не касается», голова в песок. Или наркоз — алкоголь, зависимости, цифровое ничто.',
    image: { enter: uncertaintyEnter, done: uncertaintyDone, overlap: 0.08 },
  },
  {
    id: 'temporality',
    number: 2,
    title: 'Утрата временностью',
    subtitle: 'Всё, что пришло, будет отнято',
    description:
      'Молодость, ценности, люди — всё временно. Учение стоиков: нам ничего не принадлежит, мы пришли в этот мир самостью, а остальное — то, что нам дали поддержать. Жить как дар — радость. Жить как должное — горе.',
    prompt: 'Что ты сейчас воспринимаешь как должное, что на самом деле — дар?',
    action: 'Назови одну вещь, которую сегодня стоит прожить как дар, а не как данность.',
    shadowAction:
      'Воспринимать дар как должное. Тогда потеря неизбежно превращается в боль, а не в благодарность.',
    image: { enter: temporalityEnter, done: temporalityDone, overlap: 0.08 },
  },
  {
    id: 'choice',
    number: 3,
    title: 'Богатство выбора',
    subtitle: 'Слишком много дверей',
    description:
      'Нам постоянно приходится выбирать, и мы не всегда понимаем, к чему что приведёт. Все двери непрозрачные, все усилия уходят на красивую дверь. Множественность выбора — не свобода, а дополнительное испытание.',
    prompt: 'Перед каким выбором ты сейчас стоишь и почему он так труден?',
    action: 'Выбери одну дверь. Не ту, что красивее, а ту, за которой тебе теплее.',
    shadowAction:
      'Бесконечно взвешивать варианты, не выбирая ни один. Маркетинг питает иллюзию, что дверь важнее того, что за ней.',
    image: { enter: choiceEnter, done: choiceDone, overlap: 0.08 },
  },
  {
    id: 'abundance',
    number: 4,
    title: 'Испытание изобилием',
    subtitle: 'Невозможность сфокусироваться',
    description:
      'Кругом сыплется множество предложений и возможностей. Хватаешь тут, там — нигде не достигаешь ничего действительного. Всякое действительное требует внутреннего труда, а труд требует фокуса.',
    prompt: 'Что сейчас рассеивает твой фокус больше всего?',
    action: 'Выбери одно направление и откажись от остальных на эту неделю.',
    actionPlaceholder: 'Моё одно направление…',
    shadowAction:
      'Раздёргиваться, хватать виртуальные сущности. Кажется, что много успеваешь, а на деле — опустошение.',
    signs: [
      'Открываю десять вкладок — и ни одну не дочитываю',
      'Начинаю новое, пока старое не закончено',
      'К вечеру устал, но не могу назвать, что сделал',
      'Кажется, правильный вариант где-то рядом — надо ещё поискать',
    ],
    shadowOutcome: 'Итог: много движения, ни одного результата. Опустошение.',
    heroPath:
      'Выбрать одно действительное дело и выдержать отказ от остального. Фокус — не сила воли, а решение, чего не делать.',
    heroOutcome: 'Итог: внутренний труд, который даёт результат и опору.',
    quote: 'Всякое действительное требует внутреннего труда, а труд требует фокуса.',
    image: { enter: abundanceEnter, done: abundanceDone, overlap: 0.08 },
  },
  {
    id: 'info-pressure',
    number: 5,
    title: 'Информационное давление',
    subtitle: 'Все дудят в каждый огород',
    description:
      'Каждый источник дудит в свой огород. Хоп-хоп-хоп, давай быстрее, бери сюда, беги туда. Никуда так не убежишь. Подлинная жизнь требует основательности, а не скорости.',
    prompt: 'Какой информационный поток давит на тебя сильнее всего прямо сейчас?',
    action: 'Отключи один источник информации на 24 часа. Заметь, что изменилось.',
    shadowAction:
      'Подчиниться ритму «быстрее, больше, не пропусти». Спешка опустошает, не обогащая.',
    image: {
      enter: infoPressureEnter,
      done: infoPressureDone,
      focus: '40% 40%',
      overlap: 0.08,
    },
  },
  {
    id: 'haste',
    number: 6,
    title: 'Спешка',
    subtitle: 'Товарищ с хлыстом',
    description:
      'Постоянная погоня: страх упустить что-то важное, быстрее, быстрее. Но подлинная жизнь не требует скорости, она требует основательности. В погоне человек опустошается, не обогащаясь.',
    prompt: 'От чего ты сейчас бежишь в спешке и куда пытаешься прибежать?',
    action: 'Остановись на пять минут. Ничего не делай. Заметь, что поднимается.',
    shadowAction:
      'Бежать от тревоги через действие. Кажется, что двигаешься, а на деле — убегаешь от себя.',
    image: {
      enter: hasteEnter,
      done: hasteDone,
      focus: '65% 40%',
      overlap: 0.08,
      compact: true,
    },
  },
  {
    id: 'others-lives',
    number: 7,
    title: 'Чужой жизнью',
    subtitle: 'Звонарь чужих бед',
    description:
      'Человек не живёт своей жизнью — живёт трагедиями звёзд, катастрофами в новостях. Современному человеку страшно думать про себя, легче думать про чужие драмы. Даже страдания там театрализованы, превращены в инструмент пиара.',
    prompt: 'Сколько времени сегодня ты провёл, переживая чужие события, а не свои?',
    action: 'Один день — только своя жизнь. Чужие новости — мимо.',
    shadowAction:
      'Жить духами смердящего пространства. Кажется, что ты в курсе, а на деле — прячешься от себя.',
    image: {
      enter: othersLivesEnter,
      done: othersLivesDone,
      focus: '75% 35%',
      overlap: 0.12,
      compact: true,
    },
  },
  {
    id: 'digital-avatar',
    number: 8,
    title: 'Цифровой аватар',
    subtitle: 'Персона, которая стала тобой',
    description:
      'Цифровая идентичность отросла как лишняя суперперсона. Люди теряют доступ к аккаунту — ощущают, будто потеряли себя. Персона не соответствует тени, эго не соответствует персоне. Разрыв растёт, и зеркало становится невыносимым.',
    prompt: 'Насколько твой цифровой образ соответствует тому, кем ты чувствуешь себя внутри?',
    action: 'Опиши себя без единой ссылки на соцсети, профессию или аккаунт.',
    shadowAction:
      'Отождествиться с аватаром. Фильтры, нейросети, фальшивый образ — пока зеркало не становится врагом.',
    image: {
      enter: digitalAvatarEnter,
      done: digitalAvatarDone,
      focus: '45% 40%',
      overlap: 0.12,
      compact: true,
    },
  },
  {
    id: 'comparison',
    number: 9,
    title: 'Постоянное сравнение',
    subtitle: 'Павлиньи перья чужих жизней',
    description:
      'Не имея целостности собственной жизни, мы пытаемся сложить её из отблесков чужих. Каждое сравнение на уровне тени ощущается как несостоятельность. Подлинная сила идёт изнутри, а не из подглядывания за чужим успехом.',
    prompt: 'С чьей жизнью ты себя сравниваешь чаще всего и что это даёт тебе?',
    action: 'Откажись от одного сравнения на сегодня. Замени его наблюдением за собой.',
    shadowAction:
      'Собирать себя из чужих отражений. Кажется, что достигаешь, а на деле — держится на страхе.',
    image: { enter: comparisonEnter, done: comparisonDone, focus: '30% 40%', overlap: 0.22 },
  },
  {
    id: 'mirror',
    number: 10,
    title: 'Правдивое зеркало',
    subtitle: 'Страх встретиться с собой',
    description:
      'Самая страшная мысль — встретиться с самим собой. Мы запрограммированы сравнивать себя с теми, кто лучше, и всегда в проигрыше. Но подлинная сила исходит из самости, и встреча с собой — не приговор, а начало.',
    prompt: 'Чего ты боишься увидеть, если посмотришь в зеркало честно?',
    action: 'Запиши одну черту, которую ты прячешь от себя. Не оценивая — просто назови.',
    shadowAction:
      'Бегать от зеркала, наговаривая себе причины. «Может, я не справлюсь, может, это не я» — бесконечный разговор вместо шага.',
    image: { enter: mirrorEnter, done: mirrorDone, focus: '40% 40%', overlap: 0.22 },
  },
  {
    id: 'loneliness',
    number: 11,
    title: 'Экзистенциальное одиночество',
    subtitle: 'В самые важные моменты — сам',
    description:
      'Другому человеку до его действительной внутренней жизни добраться трудно. Психотерапия — наука, которая учит преодолевать это одиночество через глубокое понимание другого. Но большинство людей живут в нём, ощущая боль покинутости.',
    prompt: 'Где ты сейчас чувствуешь одиночество, которое не заполняется общением?',
    action: 'Опиши это одиночество одним честным предложением — без попытки его исправить.',
    shadowAction:
      'Прятать одиночество за шумом, контактами, активностью. Или обвинять других в том, что они не понимают.',
    image: { enter: lonelinessEnter, done: lonelinessDone, focus: '35% 40%', overlap: 0.22 },
  },
  {
    id: 'relationships',
    number: 12,
    title: 'Иллюзия родной души',
    subtitle: 'Поиск идеального партнёра',
    description:
      'Миф о второй половинке — один из главных конкурирующих мифов. Но родная душа — это не идеальный человек, а тот, с кем на уровне самости вы способны сойтись. На уровне самости можно сойтись с кем угодно — для этого нужна личностная трансформация, а не поиск.',
    prompt: 'Что ты ищешь в другом человеке, что на самом деле ищешь в себе?',
    action: 'Опиши, что значит для тебя «открыться отношениям», без требований к партнёру.',
    shadowAction:
      'Искать идеального партнёра среди восьми миллиардов. Люди меняются, обстоятельства меняются — идеал не находится.',
    // focus — арка держится в кадре; compact — на полной высоте срезается её правая половина.
    image: { enter: relationshipsEnter, done: relationshipsDone, focus: '40% 30%', compact: true, overlap: 0.22 },
  },
  {
    id: 'lost-supports',
    number: 13,
    title: 'Разрушение опор',
    subtitle: 'Прежние опоры больше не работают',
    description:
      'Прежние опоры — профессия, знания, авторитеты — рушатся. ИИ забирает интеллектуальный функционал. Духовно-интеллектуальный труд теперь необходим: внутренняя трансформация и помощь другим. Новые смыслы обретаются через единство с собственной сущностью.',
    prompt: 'Какая опора в твоей жизни сейчас рушится или уже рухнула?',
    action: 'Назови одну новую опору, которую ты можешь начать строить изнутри.',
    shadowAction:
      'Цепляться за рухнувшую опору. Или впадать в ужас, не замечая, что старая опора была не нужна.',
    image: { enter: lostSupportsEnter, done: lostSupportsDone, focus: '50% 40%', overlap: 0.08 },
  },
  {
    id: 'age-crises',
    number: 14,
    title: 'Возрастные кризисы',
    subtitle: 'Когда черновик кончается',
    description:
      'В 33–35 — первый осознанный кризис: израсходован изначальный заряд. В 40–44 — понимание, что черновика нет, ты уже в середине тетради. Если кризис не прожить правильно, следующий будет болезненнее. Жизнь — серия вызовов, и каждый можно пройти.',
    prompt: 'Какой возрастной переход ты сейчас проживаешь или откладываешь?',
    action: 'Прими случившееся как факт. На этом основании — один шаг вперёд.',
    shadowAction:
      'Обойти кризис: уйти в работу, в детей, во что угодно. «Может, пронесёт» — не пронесёт, следующий будет тяжелее.',
    image: { enter: ageCrisesEnter, done: ageCrisesDone, focus: '55% 40%', overlap: 0.12 },
  },
  {
    id: 'meaning',
    number: 15,
    title: 'Потеря смысла',
    subtitle: 'Компас без стрелки',
    description:
      'Раньше смыслы давались извне: семья, религия, идеология. Теперь все смыслы конкурируют, и ни один не абсолютный. Мы оказались в логике, когда собственные смыслы нужно производить сами — изнутри, из самости.',
    prompt: 'Что сейчас служит тебе внутренней опорой, когда внешние смыслы не работают?',
    action: 'Сформулируй один смысл, который идёт изнутри, а не из внешнего авторитета.',
    shadowAction:
      'Искать смысл вовне, перебирая занятия и предназначения. Или подчиниться чужому смыслу, который не твой.',
    image: { enter: meaningEnter, done: meaningDone, focus: '45% 35%', overlap: 0.08 },
  },
  {
    id: 'self-assembly',
    number: 16,
    title: 'Самосборка',
    subtitle: 'Нет инструкции к себе',
    description:
      'Нам не дали инструкций, как собрать самих себя. Если собирать по кусочкам — развалимся. Всё должно расти из единого центра. Центр глубоко внутри, погребён под комплексам — но до него можно дойти.',
    prompt: 'Из какого центра ты сейчас пытаешься собрать себя?',
    action: 'Опиши одним словом, что для тебя сейчас значит «быть цельным».',
    shadowAction:
      'Собирать себя по кусочкам: ещё вот это научусь, ещё вот это. Самосборка — иллюзия, которая разваливается.',
    image: { enter: selfAssemblyEnter, done: selfAssemblyDone, focus: '40% 40%', overlap: 0.12 },
  },
]

export const HERO_JOURNEY_TOTAL_STEPS = HERO_JOURNEY_TRIALS.length

export const HERO_JOURNEY_CHAPTERS = [
  {
    key: 'call',
    roman: 'I',
    title: 'Зов',
    subtitle: 'Мир снаружи больше не опора',
    trialIds: ['uncertainty', 'temporality', 'choice', 'abundance'],
  },
  {
    key: 'threshold',
    roman: 'II',
    title: 'Порог',
    subtitle: 'Шум, который выдаёт себя за жизнь',
    trialIds: ['info-pressure', 'haste', 'others-lives', 'digital-avatar'],
  },
  {
    key: 'trials',
    roman: 'III',
    title: 'Испытания',
    subtitle: 'Встреча с собой и другими',
    trialIds: ['comparison', 'mirror', 'loneliness', 'relationships'],
  },
  {
    key: 'death',
    roman: 'IV',
    title: 'Смерть Эго',
    subtitle: 'Когда прежние опоры рушатся',
    trialIds: ['lost-supports', 'age-crises', 'meaning', 'self-assembly'],
  },
]

export const HERO_JOURNEY_FINALE = {
  key: 'return',
  title: 'Возвращение',
  subtitle: 'Карта пройденного и письмо себе',
  lockedHint: 'Откроется после 16-го шага',
}

export const HERO_JOURNEY_COURSE = {
  title: 'Путь героя',
  subtitle: '16 шагов · 4 главы',
  description:
    '16 испытаний современного человека. Каждый шаг — 6 минут: понять, узнать себя, записать, сделать одно действие.',
  chapters: HERO_JOURNEY_CHAPTERS,
  finale: HERO_JOURNEY_FINALE,
}

// ── Структура личности по Юнгу ──

export const JUNG_PERSONA_LAYERS = [
  {
    key: 'persona',
    title: 'Персона',
    role: 'Маска для других',
    description:
      'То, как ты представляешься миру. Роль, образ, цифровой аватар. От неё страдают: нет искренности, нет тепла. Но без неё нельзя — вопрос в мере.',
    color: 'gold',
  },
  {
    key: 'ego',
    title: 'Эго',
    role: 'Твой центр',
    description:
      'То, как ты сам для себя ощущаешь. Держит тебя между персоной и тенью. В кризисе эго рушится — и это точка трансформации, а не катастрофа.',
    color: 'azure',
  },
  {
    key: 'shadow',
    title: 'Тень',
    role: 'Подавленное',
    description:
      'Чем сильнее стремишься соответствовать ожиданиям, тем больше растёт тень. Комплекс самозванца — её проявление. Когда тень вырывается — сгорел сарай, гори и хата.',
    color: 'gold',
  },
  {
    key: 'anima-animus',
    title: 'Анима / Анимус',
    role: 'Внутренняя противоположность',
    description:
      'Мужская составляющая женской природы и наоборот. Женщина, тянущая мир на своих плечах — это её анимус. Мужчина, проявляющий слабость — его анима. У обоих есть положительные и отрицательные стороны.',
    color: 'azure',
  },
  {
    key: 'self',
    title: 'Самость',
    role: 'Подлинное «я»',
    description:
      'Базовое основание, где сокрыта наша сущность. То, что в религиях называют душой. Путь индивидуации — дойти до самости и остаться на ней. Из самости строится целостная жизнь.',
    color: 'gold',
  },
]

export function findTrial(id) {
  return HERO_JOURNEY_TRIALS.find(trial => trial.id === id) || null
}

export function previousTrial(id) {
  const index = HERO_JOURNEY_TRIALS.findIndex(trial => trial.id === id)
  return index > 0 ? HERO_JOURNEY_TRIALS[index - 1] : null
}

export function trialByNumber(number) {
  return HERO_JOURNEY_TRIALS.find(trial => trial.number === number) || null
}

export function chapterForTrial(id) {
  return HERO_JOURNEY_CHAPTERS.find(chapter => chapter.trialIds.includes(id)) || null
}

export function trialsForChapter(chapter) {
  if (!chapter) return []
  return chapter.trialIds.map(findTrial).filter(Boolean)
}

export function stepContents(trial) {
  const items = []
  if (Array.isArray(trial?.signs) && trial.signs.length > 0) {
    items.push('Как это проявляется')
  }
  if (trial?.heroPath) {
    items.push('Путь тени и путь героя')
  }
  items.push('Запиши ответ')
  items.push('Одно действие на сегодня')
  return items
}
