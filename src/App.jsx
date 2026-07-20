from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, CallbackQuery
from db import async_session
from models import User, MediaSetting
from keyboards import start_kb

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message):
    async with async_session() as session:
        user = await session.get(User, message.from_user.id)
        if user is None:
            user = User(
                id=message.from_user.id,
                username=message.from_user.username,
                first_name=message.from_user.first_name,
                last_name=message.from_user.last_name,
            )
            session.add(user)
            await session.commit()
        media = await session.get(MediaSetting, "start_message")

    text = "Здравствуйте, откройте приложение 👇"
    kb = start_kb()

    if media and media.file_id:
        if media.media_type == "photo":
            await message.answer_photo(media.file_id, caption=text, reply_markup=kb)
            return
        if media.media_type == "video":
            await message.answer_video(media.file_id, caption=text, reply_markup=kb)
            return
        if media.media_type == "animation":
            await message.answer_animation(media.file_id, caption=text, reply_markup=kb)
            return

    await message.answer(text, reply_markup=kb)


# Заглушки для разделов, которые пока в разработке —
# отвечаем всплывающим уведомлением, не плодим новые сообщения в чате
SOON_TEXTS = {
    "soon_modes": "Режимы и тесты скоро появятся 🧭",
    "soon_tips": "Коробка лайфаков в разработке 💡",
    "soon_settings": "Настройки скоро будут доступны ⚙️",
}


@router.callback_query(F.data.in_(SOON_TEXTS.keys()))
async def cb_soon(callback: CallbackQuery):
    await callback.answer(SOON_TEXTS[callback.data], show_alert=True)