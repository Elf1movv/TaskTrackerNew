# Изолированный тестовый сайт

Ветка: `feat/product-logic-redesign`. Рабочая версия main — `eaf417d`.
Стенд использует отдельные аккаунты, секреты, сеть и PostgreSQL-том.
Production-данные не копируются. Письма/feedback тестерам не отправляются.

## Состояние на 2026-10-05

- Ветка опубликована; приложение стенда — коммит `266a5dc`, образ
  `ghcr.io/elf1movv/tasktracker:staging-266a5dcde9f59583c98e966abe6de531f365fd30`.
- [Сборка GitHub Actions](https://github.com/Elf1movv/TaskTrackerNew/actions/runs/37110369468)
  завершилась успешно. Main остаётся `eaf417d`.
- `/var/www/tasktracker-staging`: отдельный checkout, `.env.staging` с
  правами 600, собственные секреты. Compose-проект `mytracker-staging`,
  БД `tasktracker_stage`, том `mytracker-staging_staging-db`.
- Все 20 миграций применены, повторный запуск не меняет схему.
  App слушает только `127.0.0.1:3002`, health возвращает `{"ok":true}`.
- Nginx: отдельный файл `/etc/nginx/sites-available/tasktracker-staging`
  и ссылка в sites-enabled, HTTP server_name `test.mytracker.space`.
  Конфигурация проверена; запрос с этим Host маршрутизируется на стенд.
- Проверены на развёрнутом образе: регистрация/подтверждение/вход,
  отдельные Secure/HttpOnly cookies, Note, Task→Goal, Plan→Task,
  точная длительность, On hold, относительные сигналы, удаление цели
  с сохранением задач/планов и явная очистка будущих интервалов.
  Временный QA-аккаунт и его данные удалены после проверки.
- Рабочий сайт и его `/api/health` отвечают; production не обновлялся.
- DNS-запись `test.mytracker.space` → `185.65.202.121` добавлена владельцем.
  HTTPS-сертификат выпущен 2026-10-05, срок до 2027-01-03, автоматическое
  продление настроено Certbot. HTTP перенаправляется на HTTPS.
- Тестовый вход и регистрация явно подписаны как отдельный сайт.
  После регистрации показывается инструкция ручной активации вместо
  обещания письма: доставка почты на стенде отключена.
- Проверка входа через публичный HTTPS в настоящем браузере — следующий шаг.

## Подготовка

1. DNS: A-запись `test.mytracker.space` → `185.65.202.121`.
2. Отдельная директория `/var/www/tasktracker-staging`; не использовать
   `/var/www/tasktracker` и его env/Compose для тестовых команд.
3. Скопировать `.env.staging.example` в `.env.staging`, создать независимые
   случайные секреты, права файла 600. Не добавлять файл в Git.
4. Workflow `staging.yml` собирает только `staging-<SHA>`; production
   `latest` не затрагивается. Указать этот неизменяемый тег в env.
5. Проверить конфигурацию командой ниже, затем запустить БД, миграцию и app.

```sh
docker compose --env-file .env.staging -p mytracker-staging -f docker-compose.staging.yml config --quiet
docker compose --env-file .env.staging -p mytracker-staging -f docker-compose.staging.yml pull
docker compose --env-file .env.staging -p mytracker-staging -f docker-compose.staging.yml up -d db
docker compose --env-file .env.staging -p mytracker-staging -f docker-compose.staging.yml run --rm -T app node scripts/deploy-staging-schema.mjs < /dev/null
docker compose --env-file .env.staging -p mytracker-staging -f docker-compose.staging.yml up -d app
```

На чистой БД историческая миграция категорий требует устранения четырёх
стартовых записей без владельца. `deploy-staging-schema.mjs` проверяет
пустоту пользовательских таблиц и точный состав этих записей, исправляет
только их и продолжает миграции. На production скрипт запускать запрещено;
он сам проверяет отдельное имя БД/префикс. Применённые миграции не меняются.

6. Отдельный nginx server_name с proxy_pass http://127.0.0.1:3002,
   отдельный HTTPS-сертификат. Проверить `nginx -t` перед reload.
7. Проверить health, вход, CRUD, переносы, связи и отсутствие production
   cookies. Префикс cookies: `mytracker-staging`, домен отдельный.

## Тестовые аккаунты

Пользователь регистрируется с отдельным тестовым паролем. Реальных писем
нет; подтверждается только запрошенный тестовый аккаунт:

```sh
docker compose --env-file .env.staging -p mytracker-staging -f docker-compose.staging.yml exec app node scripts/verify-staging-user.mjs tester@example.com
```

Скрипт откажется работать без префикса staging и имени тестовой БД.

## Возврат

До выпуска в main достаточно прекратить использование стенда — рабочий
сайт всё время остаётся прежним. Тестовый том не удалять: его данные могут
понадобиться для сравнения/доработки.

Выпуск в main требует отдельного подтверждения после пользовательского
тестирования. До него обязательны свежий production-бэкап, пробное
восстановление, сохранённый предыдущий образ и проверенный экспорт новых
сущностей. Старый код не показывает Note/CalendarPlan; один task не может
представить несколько новых интервалов. Поэтому возврат образа сам по себе
не является полноценным возвратом логики с сохранением видимости новых
данных. Не восстанавливать старый бэкап поверх новых записей молча.
