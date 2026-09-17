# Документация требований

Дерево функциональных требований по фичам — что должно делать
приложение и как это устроено на клиенте/сервере. Формат и правила
именования — `STYLE_GUIDE.md` в этой же папке.

Отличие от остальных доков в `docs/`:
- `docs/ARCHITECTURE.md` — **почему** так устроено технически (паттерны,
  компромиссы, gotchas)
- `docs/DEPLOYMENT.md` — продовая инфраструктура
- `docs/requirements/` (этот файл) — **что именно** должна делать каждая
  фича, по шагам, достаточно подробно, чтобы можно было восстановить
  поведение приложения только по этим файлам

## Дерево фич

- [01. Tasks](./01.%20Tasks.md)
  - [01.01. Task CRUD-FRONTEND](./01.%20Tasks/01.01.%20Task%20CRUD-FRONTEND.md)
  - [01.01. Task CRUD-BACKEND](./01.%20Tasks/01.01.%20Task%20CRUD-BACKEND.md)
- [02. Goals](./02.%20Goals.md)
  - [02.01. Goal CRUD-FRONTEND](./02.%20Goals/02.01.%20Goal%20CRUD-FRONTEND.md)
  - [02.01. Goal CRUD-BACKEND](./02.%20Goals/02.01.%20Goal%20CRUD-BACKEND.md)
- [03. Habits](./03.%20Habits.md)
  - [03.01. Habit CRUD-FRONTEND](./03.%20Habits/03.01.%20Habit%20CRUD-FRONTEND.md)
  - [03.01. Habit CRUD-BACKEND](./03.%20Habits/03.01.%20Habit%20CRUD-BACKEND.md)
- [04. Calendar](./04.%20Calendar.md)
  - [04.01. Calendar-FRONTEND](./04.%20Calendar/04.01.%20Calendar-FRONTEND.md)
    (без BACKEND — использует обычный CRUD задач, своих серверных
    методов нет)
- [05. Today (Dashboard)](./05.%20Today.md)
  - [05.01. Today Dashboard-FRONTEND](./05.%20Today/05.01.%20Today%20Dashboard-FRONTEND.md)
    (без BACKEND — собирает уже существующие данные, не хранит своих)
- [06. Navigation](./06.%20Navigation.md)
  - [06.01. Sidebar Stats-FRONTEND](./06.%20Navigation/06.01.%20Sidebar%20Stats-FRONTEND.md)
    (без BACKEND — чисто клиентские вычисления над уже загруженными
    данными)

Дерево полностью покрывает текущий функционал приложения (обновлено
2026-09-17). Дальше — поддерживать в актуальном состоянии по
`<WhenToUpdate>` из `STYLE_GUIDE.md`: новая функциональность → новый
`NN.MM.` файл, изменение поведения → правка существующего файла, а не
создание нового рядом.
