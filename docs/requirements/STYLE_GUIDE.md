---
name: TaskTracker Documentation Style Guide
description: Conventions for writing feature requirement docs in docs/requirements/. Adapted from a reference Confluence-style enterprise doc set, scaled down for this project.
---

<Language>
- Primary language: Russian
- Technical terms (field names, API endpoints, JSON keys, types): English
</Language>

<FieldReferences>
Wrap all field and variable names in single quotes inside inline code:

- Description: `'fieldName' — что это значит.`
- Assignment: `'fieldName' = value`
- Condition: `'fieldName' !== "done"`
- Arrow notation: use `→` not `->` for flows and transitions
</FieldReferences>

<NamingConventions>
| Context | Style |
|---------|-------|
| Prisma-модель / колонки БД | `camelCase` (в этом проекте Prisma-схема без `@map`, поэтому колонки БД и поля API совпадают буквально) |
| API request/response fields | `camelCase` |
| UI controls and frontend fields | `camelCase` |
</NamingConventions>

<InternalLinks>
- Ссылки между доками — обычные относительные markdown-ссылки
  (`[01.01. Task CRUD-BACKEND](./01.01.%20Task%20CRUD-BACKEND.md)`), не
  Confluence-нотация
- Для несуществующей пока страницы — `#TODO`, не выдумывать путь
- Ссылка на код — `file_path:line_number` (например,
  `server/src/routes/tasks.ts:37`), чтобы можно было сразу перейти к месту
</InternalLinks>

<DocumentType_Backend>
Суффикс файла: `*-BACKEND.md`

Открывающая строка для каждого метода:
> `1. При получении [МЕТОД /путь] сервер должен:`

Только **нумерованные списки** для логики, условий и шагов. Никогда не
использовать маркированные списки для последовательной логики.

```
1. Проверить тело запроса
   1. 'title' не должен быть пустым
   2. 'priority' должен быть одним из `"low" | "medium" | "high"`
2. Сохранить в базу
3. Вернуть ответ
```

Обязательный раздел в конце — **Известные ограничения**, если они есть
(например, whole-collection PUT перезаписывает всю коллекцию целиком — см.
`docs/ARCHITECTURE.md`).
</DocumentType_Backend>

<DocumentType_Frontend>
Суффикс файла: `*-FRONTEND.md`

Обязательные разделы, в этом порядке:
```
# Описание
# Где находится (файлы)
# Функциональные требования
```

Нумерованные списки — для функциональных требований (это последовательная
логика поведения). Маркированные списки — только для неупорядоченных
наборов вариантов (например, список доступных категорий).
</DocumentType_Frontend>

<DocumentType_General>
Страницы уровня категории, группирующие фичи. Имя файла:
`NN. Feature Name.md` (без суффикса `-FRONTEND`/`-BACKEND`) — краткое
описание, что входит в фичу, и ссылки на дочерние `*-FRONTEND.md` /
`*-BACKEND.md` файлы.
</DocumentType_General>

<PageStructure>
### Структура папки фичи

Папка `docs/requirements/NN. Feature Name/`, внутри — файлы по типу
документа:
- `NN.MM. Sub-feature-FRONTEND.md` — клиентская логика/UI (см.
  `DocumentType_Frontend`)
- `NN.MM. Sub-feature-BACKEND.md` — серверная логика (см.
  `DocumentType_Backend`) — создаётся только если у под-фичи реально есть
  своя серверная логика; чисто клиентские вещи (например, drag-and-drop
  порядка в UI без своего API-метода) обходятся без `-BACKEND.md`

Нумерация: `NN` — фича верхнего уровня (`01. Tasks`, `02. Goals`, ...),
`MM` — под-фича внутри неё (`01.01`, `01.02`, ...). Порядок номеров = не
порядок разработки, а порядок, удобный для чтения (основное → частности).
</PageStructure>

<WhenToUpdate>
Документация в `docs/requirements/` обновляется **вместе** с кодом, не
после:
- Добавили функциональность → создаём новый `NN.MM.` файл
- Изменили поведение существующей фичи → правим существующий файл, а не
  создаём новый рядом
- Убрали функциональность → удаляем или явно помечаем как "Удалено
  (дата)" с причиной, если полезно сохранить историю решения
</WhenToUpdate>
