// Line icons for every emoji in HABIT_ICONS (src/entities/habit/model/habitIcons.ts)
// plus the fixed "General" block icon (📋, GENERAL_ICON in habitGroupDisplay.ts).
//
// The emoji stays the value stored in the database — nothing about the data
// model changes. Only the rendering does: wherever the UI used to print the
// emoji, render <HabitIcon emoji={habit.icon} /> instead.
//
// Drawn on a 24×24 grid, stroke 1.75, round caps/joins — the same style as
// lucide-react, which the rest of the UI already uses, so they sit together.
//
// Lives in shared/ (not entities/habit) even though the data is habit-shaped:
// shared/ui/emoji-picker.tsx needs to render these too, and shared can't
// depend on entities. Rendered by shared/ui/habit-icon.tsx; entities/habit
// re-exports both for convenience at existing call sites.

export type HabitIconMeta = { ru: string; en: string; d: string }

export const HABIT_ICON_PATHS: Record<string, HabitIconMeta> = {
  "🏃": {
    ru: "Бег",
    en: "Running",
    d: "M13 4a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 17l5 1 .75-1.5M15 21v-4l-4-3 1-6M7 12V9l5-1 3 3 3 1",
  },
  "💪": {
    ru: "Сила",
    en: "Strength",
    d: "M12.4 13A5 5 0 0 1 22 15c0 3.9-4 7-9 7-4.1 0-8.2-.8-10.4-2.5-.4-.3-.6-.8-.6-1.4C2.1 12.7 2.6 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.1 0-1.6-.4-2-1M15 14a5 5 0 0 0-7.6 2M10 6.8C8 8 9.5 13 8 15",
  },
  "🏋️": { ru: "Штанга", en: "Weights", d: "M6.5 6v12M17.5 6v12M3.5 9v6M20.5 9v6M6.5 12h11" },
  "🧘": {
    ru: "Медитация",
    en: "Meditation",
    d: "M10 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M12 9v5M6 11c2 1 4 1.5 6 1.5s4-.5 6-1.5M4 19c3-2 5-3 8-3s5 1 8 3M8 20h8",
  },
  "🚴": {
    ru: "Велосипед",
    en: "Cycling",
    d: "M2.0 17.5a3.5 3.5 0 1 0 7.0 0a3.5 3.5 0 1 0 -7.0 0M15.0 17.5a3.5 3.5 0 1 0 7.0 0a3.5 3.5 0 1 0 -7.0 0M14 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M12 17.5V14l-3-3 4-3 2 3h2",
  },
  "🏊": {
    ru: "Плавание",
    en: "Swimming",
    d: "M2 20c2 1.3 3.5 1.3 5 0s3-1.3 5 0 3.5 1.3 5 0 3-1.3 5 0M2 15.5c2 1.3 3.5 1.3 5 0s3-1.3 5 0 3.5 1.3 5 0 3-1.3 5 0M15 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 12l4-5 4 3 3-2",
  },
  "⚽": {
    ru: "Футбол",
    en: "Football",
    d: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M12 7l4 3-1.5 5h-5L8 10zM12 7V2M16 10l5-2M14.5 15l3 4.5M9.5 15l-3 4.5M8 10 3 8",
  },
  "🎾": {
    ru: "Теннис",
    en: "Tennis",
    d: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M6 5.3a9 9 0 0 1 0 13.4M18 5.3a9 9 0 0 0 0 13.4",
  },
  "💧": {
    ru: "Вода",
    en: "Water",
    d: "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z",
  },
  "🥗": {
    ru: "Салат",
    en: "Salad",
    d: "M3 11h18a9 9 0 0 1-18 0zM12 11c0-3 1.5-5 4-6M9 11c-1-2-.5-4 1-5M15 11c1-2 3-3 5-3",
  },
  "🍎": {
    ru: "Фрукты",
    en: "Fruit",
    d: "M12 6.53A5 5 0 0 0 7 4C4 4 3 7 3 10c0 5 4 10 6 10 1 0 2-1 3-1s2 1 3 1c2 0 6-5 6-10 0-3-1-6-4-6a5 5 0 0 0-5 2.53zM12 6.5V2",
  },
  "🚭": {
    ru: "Без курения",
    en: "No smoking",
    d: "M2 2l20 20M12 12H2v4h14M22 12v4M7 12v4M18 8c0-2.5-2-2.5-2-5M22 8c0-2.5-2-2.5-2-5",
  },
  "🍷": { ru: "Без алкоголя", en: "No alcohol", d: "M8 22h8M12 13.5V22M7 3h10l.5 5a5.5 5.5 0 0 1-11 0z" },
  "😴": { ru: "Сон", en: "Sleep", d: "M4 8h6l-6 8h6M14 4h4l-4 5h4M15 15h5l-5 5h5" },
  "🛌": { ru: "Отдых", en: "Rest", d: "M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" },
  "🌅": {
    ru: "Рассвет",
    en: "Sunrise",
    d: "M12 2v8M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M8 6l4-4 4 4M16 18a4 4 0 0 0-8 0",
  },
  "📚": {
    ru: "Чтение",
    en: "Reading",
    d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  },
  "✍️": { ru: "Письмо", en: "Writing", d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" },
  "🎓": { ru: "Учёба", en: "Study", d: "M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5" },
  "🧠": {
    ru: "Мозг",
    en: "Mind",
    d: "M12 5a3 3 0 1 0-6 .1 4 4 0 0 0-2.5 5.8 4 4 0 0 0 .6 6.6A4 4 0 1 0 12 18ZM12 5a3 3 0 1 1 6 .1 4 4 0 0 1 2.5 5.8 4 4 0 0 1-.6 6.6A4 4 0 1 1 12 18ZM12 5v13",
  },
  "💡": {
    ru: "Идея",
    en: "Idea",
    d: "M9 18h6M10 22h4M15.1 14c.2-1 .7-1.7 1.4-2.5A4.7 4.7 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5A4.6 4.6 0 0 1 8.9 14",
  },
  "🎯": {
    ru: "Цель",
    en: "Target",
    d: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
  },
  "📝": {
    ru: "Заметки",
    en: "Notes",
    d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5",
  },
  "🗣️": {
    ru: "Разговор",
    en: "Talk",
    d: "M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12zM8.5 12h.01M12 12h.01M15.5 12h.01",
  },
  "🎨": {
    ru: "Рисование",
    en: "Drawing",
    d: "M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3c.4.5.5 1 .5 1.2 0 .9-1.3 1.5-3 1.5zM6.5 11a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M9.5 7a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M14.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
  },
  "🎵": {
    ru: "Музыка",
    en: "Music",
    d: "M9 18V5l12-2v13M3 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M15 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
  },
  "🎸": {
    ru: "Гитара",
    en: "Guitar",
    d: "M13 11l7-7M18.5 2.5l3 3M10.5 9.5c-1.5-1.5-4.5-1-5.5 1-.4.8-1.4 1.3-2.2 1.6-1.5.6-1.8 2.8-.3 4.8l3.1 3.1c2 1.5 4.2 1.2 4.8-.3.3-.8.8-1.8 1.6-2.2 2-1 2.5-4 1-5.5zM7.5 15a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0",
  },
  "📷": {
    ru: "Фото",
    en: "Photo",
    d: "M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8.5 13a3.5 3.5 0 1 0 7.0 0a3.5 3.5 0 1 0 -7.0 0",
  },
  "🧩": {
    ru: "Головоломки",
    en: "Puzzles",
    d: "M4 4h6a2 2 0 1 1 4 0h6v6a2 2 0 1 0 0 4v6h-6a2 2 0 1 0-4 0H4v-6a2 2 0 1 1 0-4z",
  },
  "♟️": {
    ru: "Шахматы",
    en: "Chess",
    d: "M9 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M8.5 11h7M10 11l-1.5 7M14 11l1.5 7M7 18h10v3H7z",
  },
  "🎮": {
    ru: "Игры",
    en: "Games",
    d: "M6 11h4M8 9v4M15 12h.01M18 10h.01M17.3 5H6.7a4 4 0 0 0-4 3.6c0 .2-.8 6.5-.8 7.4a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4A2 2 0 0 1 9.7 16h4.6a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-.9-.8-7.2-.8-7.4A4 4 0 0 0 17.3 5z",
  },
  "🌱": {
    ru: "Рост",
    en: "Growth",
    d: "M7 20h10M12 20v-8M12 12C12 8 9 6 5 6c0 4 3 6 7 6zM12 10c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5z",
  },
  "🧹": { ru: "Уборка", en: "Cleaning", d: "M12 2v9M8 11h8l2 10H6zM10 21v-4M14 21v-4M12 21v-4" },
  "🧺": { ru: "Стирка", en: "Laundry", d: "M3 10h18l-2 10H5zM7 10l3-6M17 10l-3-6M9 14v3M12 14v3M15 14v3" },
  "🍳": {
    ru: "Готовка",
    en: "Cooking",
    d: "M2 12a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M6.5 12a2.5 2.5 0 1 0 5.0 0a2.5 2.5 0 1 0 -5.0 0M14 17l6 5",
  },
  "🐕": {
    ru: "Питомец",
    en: "Pet",
    d: "M9 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M16 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M18 16a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z",
  },
  "💰": { ru: "Финансы", en: "Finance", d: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  "📅": {
    ru: "Планирование",
    en: "Planning",
    d: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  },
  "⏰": {
    ru: "Подъём",
    en: "Wake up",
    d: "M4 13a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M12 9v4l2 2M5 3 2 6M22 6l-3-3",
  },
  "✨": {
    ru: "Искра",
    en: "Sparkle",
    d: "M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2zM19 3v4M17 5h4",
  },
  "🔥": {
    ru: "Серия",
    en: "Streak",
    d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  },
  "❤️": {
    ru: "Здоровье",
    en: "Health",
    d: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z",
  },
  "🙏": {
    ru: "Благодарность",
    en: "Gratitude",
    d: "M12 4v9M12 4c-1-1-2.5-.5-3 1L7 12l-3 3v5h5l3-3M12 4c1-1 2.5-.5 3 1l2 7 3 3v5h-5l-3-3",
  },
  "🧴": {
    ru: "Уход",
    en: "Self-care",
    d: "M10 2h4v3h-4zM9 5h6l1.5 3v12a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V8zM7.5 12h9",
  },
  "🦷": {
    ru: "Зубы",
    en: "Teeth",
    d: "M7 3c-2.5 0-4 2-4 4.5 0 2 1 3.5 1.5 5.5.5 2.5 1 8 3 8 1.5 0 1.5-4 4.5-4s3 4 4.5 4c2 0 2.5-5.5 3-8 .5-2 1.5-3.5 1.5-5.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z",
  },
  "🚶": {
    ru: "Прогулка",
    en: "Walk",
    d: "M11 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M12.5 8 12 14M12 14l-2.5 7M12 14l3 3v4M12.5 8 9 12M12.5 8l2.5 3 3 1",
  },
  "🌞": {
    ru: "Солнце",
    en: "Sun",
    d: "M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
  },
  "🌙": { ru: "Вечер", en: "Evening", d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" },
  "📋": {
    ru: "Общий",
    en: "General",
    d: "M9 2h6v4H9zM9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3M8 12h8M8 16h5",
  },
}

// Old test fixtures use "sparkles" as an icon value — map it to ✨.
const ALIASES: Record<string, string> = { sparkles: "✨" }

export function getHabitIconMeta(emoji: string): HabitIconMeta | undefined {
  return HABIT_ICON_PATHS[emoji] ?? HABIT_ICON_PATHS[ALIASES[emoji] ?? ""]
}
