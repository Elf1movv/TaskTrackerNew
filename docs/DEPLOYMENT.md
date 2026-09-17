# Деплой: продовая инфраструктура

Этот файл описывает **фактическое состояние** продового сервера — что на
нём установлено, как настроено и как это переделать/повторить с нуля,
если сервер придётся пересоздать. Ничего секретного здесь не хранится
(пароли и ключи — только на самом сервере и в GitHub Secrets), но
структура и конфиги — да, специально, чтобы это не зависело от памяти
конкретного человека или AI-сессии.

## Инфраструктура

- **Провайдер**: HipHosting
- **IP**: `185.65.202.121`
- **ОС**: Ubuntu 24.04
- **Домен**: `mytracker.space` (+ `www.mytracker.space`), куплен на reg.ru,
  DNS — A-записи на `185.65.202.121`
- **HTTPS**: сертификат Let's Encrypt через certbot, автопродление
  настроено самим certbot (systemd-таймер), истекает 2026-12-14 (без
  действий с нашей стороны обновится сам заранее)

Никаких управляемых платформ (Vercel/Railway/Heroku и т.п.) — осознанный
выбор, см. `docs/ARCHITECTURE.md` и историю решений. Всё своё: приложение
и PostgreSQL — оба в Docker-контейнерах (с 2026-09-17), свой nginx на
своём VPS.

## Доступ

- Вход только по SSH-ключу, парольный вход и root-логин отключены
  (`PermitRootLogin no`, `PasswordAuthentication no` в
  `/etc/ssh/sshd_config`)
- Рабочий пользователь: `deploy`. **Уточнение**: у `deploy` настроен
  **полный passwordless sudo** (`(ALL) NOPASSWD: ALL` в
  `/etc/sudoers.d/deploy`, проверено `sudo -l`) — не только на
  `systemctl`, как было неточно написано здесь раньше. `deploy` также
  состоит в группе `docker` — это не расширяет реальные права (они и
  так эквивалентны root через sudo), просто позволяет не писать `sudo`
  перед каждой `docker`-командой
- Firewall: `ufw`, разрешены только порты 22 (SSH), 80 (HTTP), 443
  (HTTPS)

## Установленное ПО (через apt / официальные репозитории)

- **Docker Engine + Compose plugin** — через официальный apt-репозиторий
  Docker (`download.docker.com`), см. раздел "Docker: образ и контейнер"
  ниже. Само приложение (Node/Express) теперь работает **внутри
  контейнера**, не как процесс на самом VPS
- **Node.js** — LTS, через NodeSource, был установлен для сборки/запуска
  bare-процесса на VPS до перехода на Docker (2026-09-16). Сейчас
  ничего не использует его напрямую (сборка происходит в GitHub
  Actions, приложение — в контейнере), можно оставить для отладки/
  разовых команд или удалить — не мешает
- **PostgreSQL 16** — через apt, кластер БД в `/var/lib/postgresql/16/main`.
  **С 2026-09-17 остановлен и не используется приложением** — сама база
  теперь в Docker-контейнере (см. "База данных" ниже). Оставлен
  установленным, но выключенным, как страховка отката — данные на диске
  не удалялись, будут физически стёрты не раньше начала октября 2026
  (двухнедельный период наблюдения после переключения, см. план в
  истории коммитов)
- **nginx** — через apt, версия 1.24
- **certbot** + `python3-certbot-nginx` — для HTTPS, уже запущен и
  настроен (см. раздел "nginx: reverse proxy + HTTPS" ниже)

## База данных

**С 2026-09-17 PostgreSQL работает в Docker-контейнере** (`tasktracker-db`,
образ `postgres:16-bookworm`) — та же мажорная версия, что была у
нативной установки (обязательно для совместимости дампа при переносе).

- БД: `tasktracker`, пользователь: `tasktracker`
- Данные хранятся в именованном Docker volume `tasktracker-db-data`
  (**не** bind mount) — управляется самим Docker, живёт независимо от
  жизненного цикла контейнера
- Пароль лежит в `/var/www/tasktracker/db.env` на сервере (gitignored,
  отдельно от `server/.env` — меньше площадь у секрета), и всё ещё
  дублируется в `/home/deploy/db_url.txt` (исторически, для справки)
- `db` **не публикует никакого порта на хост** — недоступен ни снаружи
  VPS, ни даже с самого хоста напрямую, только изнутри Docker-сети
  `tasktracker-net` по имени сервиса `db`. Строже, чем было у нативной
  версии (та была ограничена `listen_addresses = localhost`, но
  технически имела открытый порт на loopback)

**⚠️ Самая опасная команда в этой системе**: `docker compose down -v`
или `docker volume rm tasktracker-db-data` — необратимо удаляет все
данные. Обычный `docker compose down` (без `-v`) безопасен, удаляет
только контейнеры и сеть, volume не трогает.

**⚠️ Gotcha с именем volume**: если в `docker-compose.yml` когда-нибудь
уберётся явный `name: tasktracker-db-data` у volume — Docker Compose
молча подставит префикс имени проекта (`tasktracker_tasktracker-db-data`),
и `docker compose up -d db` создаст **новый пустой** volume вместо
реального. Всё будет выглядеть рабочим (healthcheck зелёный, миграции
применятся к пустой схеме без ошибок) — обнаружится только когда
откроешь приложение и увидишь пустоту. Всегда держать `name:` явным.

### Бэкапы

Скрипт `/home/deploy/backup-db.sh` на сервере, запускается ежедневно в
03:00 через `crontab -l` (пользователь `deploy`), теперь снимает дамп
**изнутри контейнера**, не с хоста:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR=/home/deploy/backups
mkdir -p "$BACKUP_DIR"

cd /var/www/tasktracker
DB_PASSWORD=$(grep DATABASE_URL server/.env | sed -E 's#.*://[^:]+:([^@]+)@.*#\1#')

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
docker compose exec -T -e PGPASSWORD="$DB_PASSWORD" db \
  pg_dump -h localhost -U tasktracker tasktracker \
  | gzip > "$BACKUP_DIR/tasktracker_${TIMESTAMP}.sql.gz"

# Храним последние 14 бэкапов, остальные удаляем
ls -1t "$BACKUP_DIR"/tasktracker_*.sql.gz | tail -n +15 | xargs -r rm --
```

`-T` обязателен — у cron нет TTY, а `docker compose exec` по умолчанию
пытается его выделить. Формат бэкапа не изменился (`.sql.gz`, обычный
SQL) — протестировано восстановление свежего бэкапа в отдельный
тестовый контейнер сразу после миграции (2026-09-17), прошло успешно.

Бэкапы лежат в `/home/deploy/backups/`, хранится последние 14 штук.
**Ограничение**: бэкапы на том же сервере, что и сама БД — не защищают
от потери VPS целиком, только от случайной порчи данных на живом
сервере. Восстановление (команда изменилась — теперь через
`docker compose exec`, не напрямую `psql`) и рекомендация по скачиванию
бэкапов на свой компьютер — `PROJECT_BRAIN.md`, раздел 7.4.

## Расположение приложения

Код склонирован в `/var/www/tasktracker` (публичный GitHub-репозиторий,
клонируется без авторизации):

```
git clone https://github.com/Elf1movv/TaskTrackerNew.git /var/www/tasktracker
```

### Файлы окружения (создаются вручную на сервере, не в git)

`/var/www/tasktracker/.env` — **больше не используется в проде**
(остался как безобидный мусор с bare-процесса до 2026-09-16): значение
`VITE_API_URL=/api` теперь запекается прямо в образ на этапе сборки
(`ENV VITE_API_URL=/api` в `Dockerfile`), потому что фронтенд больше не
собирается на самом VPS.

`/var/www/tasktracker/server/.env` — **всё ещё используется**,
контейнер подключает его через `env_file` в `docker-compose.yml`:
```
DATABASE_URL="postgresql://tasktracker:<пароль>@db:5432/tasktracker"
PORT=3001
```
Хост в `DATABASE_URL` — `db` (имя сервиса в Docker-сети), не `localhost`
и не IP: с 2026-09-17, после перехода на bridge-сеть, `app` достаёт базу
по внутреннему DNS Docker, не через loopback хоста.

`/var/www/tasktracker/db.env` — новый файл (тоже gitignored), пароль для
самого контейнера `db`:
```
POSTGRES_PASSWORD=<тот же пароль>
```

## Docker: образы и контейнеры

Приложение (фронтенд + бэкенд одним процессом, см.
`docs/ARCHITECTURE.md`) собирается в один Docker-образ по
многоступенчатому `Dockerfile` (в корне репозитория) — сборка происходит
**в GitHub Actions**, не на VPS: frontend-стадия (`npm run build` →
`dist/`), backend-стадия (`prisma generate` + `tsc` → `server/dist/`),
финальная тонкая рантайм-стадия собирает всё вместе.

Образ пушится в **GitHub Container Registry** (`ghcr.io/elf1movv/tasktracker`,
тегами `:latest` и `:<sha>` для отката), пакет сделан публичным вручную
через настройки GitHub (Packages → tasktracker → Package settings →
Change visibility → Public) — без этого VPS не смог бы `docker compose
pull` без учётных данных для реестра. Postgres берётся готовым из
Docker Hub (`postgres:16-bookworm`), ничего дополнительно собирать
не нужно.

`docker-compose.yml` (в корне репозитория, доезжает до VPS через
`git pull`, лежит в `/var/www/tasktracker/docker-compose.yml`) — с
2026-09-17 два сервиса:
```yaml
services:
  app:
    image: ghcr.io/elf1movv/tasktracker:latest
    container_name: tasktracker
    restart: unless-stopped
    env_file:
      - server/.env
    ports:
      - "127.0.0.1:3001:3001"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - tasktracker-net

  db:
    image: postgres:16-bookworm
    container_name: tasktracker-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: tasktracker
      POSTGRES_DB: tasktracker
    env_file:
      - db.env
    volumes:
      - tasktracker-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tasktracker -d tasktracker"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - tasktracker-net

networks:
  tasktracker-net:
    name: tasktracker-net

volumes:
  tasktracker-db-data:
    name: tasktracker-db-data
```

**Сеть — bridge, не host** (сменилось при добавлении `db`): раньше был
`network_mode: host`, потому что Postgres был нативным и контейнеру
нужен был доступ к `127.0.0.1` хоста. Как только Postgres тоже
переехал в контейнер, эта причина исчезла — `app` публикует только
`127.0.0.1:3001` (то же самое, что видел nginx раньше — nginx не
тронут), `db` не публикует вообще ничего, виден только изнутри
Docker-сети. Побочный плюс: `app`-контейнер больше не видит все сетевые
интерфейсы хоста, только свою изолированную сеть.

`depends_on: condition: service_healthy` — `app` не запустится, пока
`db` не пройдёт `pg_isready`-healthcheck; нужен Compose V2 (плагин, не
старый отдельный `docker-compose`) — уже используется, подтверждено
(`docker compose version` → v5.5.1).

`restart: unless-stopped` — сам Docker перезапускает оба контейнера при
падении и после перезагрузки VPS (проверено дважды: `sudo reboot` и до,
и после переноса базы — оба раза поднялись сами, без вмешательства).

**Ротация логов**: у Docker-драйвера `json-file` по умолчанию **нет
ограничения на размер** — лог-файл контейнера рос бы бесконечно. В
`docker-compose.yml` есть общий якорь `x-logging` (`max-size: "10m"`,
`max-file: "3"`), применённый к обоим сервисам — не больше 30MB логов
на контейнер, старые файлы ротируются автоматически.

Управление:
```bash
docker compose -f /var/www/tasktracker/docker-compose.yml ps
docker compose -f /var/www/tasktracker/docker-compose.yml logs -f
docker compose -f /var/www/tasktracker/docker-compose.yml restart
```

**Осознанно НЕ добавлено в автопайплайн**: `docker volume prune` — без
явного указания имени удаляет любой неприсоединённый volume без
подтверждения; если `db` хоть раз не поднимется вовремя во время
автодеплоя, это могло бы снести продовые данные без участия человека.
Чистка диска — только вручную, по конкретному имени volume.

**Известные gotcha (из миграции 2026-09-16 — 2026-09-17)**:
1. При первом переходе на Docker: старый `tasktracker.service`
   (bare-процесс) и новый контейнер несколько минут боролись за порт
   `3001` — контейнер уходил в restart-loop, пока старый systemd-юнит
   не был явно остановлен. При переносе на новый VPS — сначала
   убедиться, что ничего больше не слушает `3001`
2. При переносе базы в контейнер: `name:` у volume — обязателен (см.
   раздел "База данных" выше) — без него легко тихо получить пустую
   базу вместо реальной
3. Если когда-нибудь "временно для отладки" поменяешь
   `127.0.0.1:3001` на `0.0.0.0:3001` — Docker умеет вставлять
   iptables-правила, обходящие ограничения `ufw` именно для портов,
   опубликованных на `0.0.0.0`. Не делать этого без явного понимания
   последствий
4. **`git pull` на VPS может упасть на несвязанном с деплоем конфликте**
   (обнаружено 2026-09-17): в `/var/www/tasktracker/package.json` на
   сервере оставалось незакоммиченное изменение (npm сам дописал
   `allowScripts` при установке пакетов ещё в эпоху до-Docker деплоя,
   когда `npm install` реально выполнялся на самом VPS) — оно тихо
   лежало годами безвредно, пока новый коммит не тронул тот же файл и
   `git pull` не отказался мержить. Автодеплой в CI из-за этого дважды
   подряд падал на шаге `git pull`, **сборка образа при этом проходила
   успешно** — путать с реальной поломкой приложения не стоит, значит
   проблема именно на стороне VPS-репозитория, а не в самом коде.
   Починка: `git checkout -- package.json && git pull` на сервере — с
   переходом на Docker `npm` на самом VPS больше никогда не запускается
   (вся сборка — в CI), так что подобная рассинхронизация отслеживаемых
   файлов больше в принципе не должна возникать

## nginx: reverse proxy + HTTPS

Конфиг `/etc/nginx/sites-available/tasktracker` (симлинк в
`sites-enabled`), `default`-сайт отключён. Итоговая версия после
`certbot --nginx -d mytracker.space -d www.mytracker.space` (certbot сам
дописал блок HTTPS и редирект, вручную это не редактировалось):

```nginx
server {
    server_name mytracker.space www.mytracker.space;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/mytracker.space/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/mytracker.space/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
    if ($host = www.mytracker.space) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = mytracker.space) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name mytracker.space www.mytracker.space;
    return 404; # managed by Certbot
}
```

Любой HTTP-запрос редиректит на HTTPS (301). Сертификат обновляется
автоматически — certbot поставил systemd-таймер, вручную ничего делать
не нужно (можно проверить: `sudo systemctl list-timers | grep certbot`).

Проверка конфига перед reload — всегда: `sudo nginx -t`, потом
`sudo systemctl reload nginx`. **Не редактировать блоки `# managed by
Certbot` вручную** — при следующем продлении certbot их перепишет заново.

## Ручной передеплой

```bash
ssh deploy@185.65.202.121
cd /var/www/tasktracker
git pull                                        # подтянуть docker-compose.yml, если менялся
docker compose pull                             # скачать свежий образ с ghcr.io
docker compose run --rm app npx prisma migrate deploy
docker compose up -d
docker image prune -f                           # убрать старые слои, не копить диск
```

## CI/CD: автодеплой при пуше в main

`.github/workflows/deploy.yml` — два джоба:

1. **`build-and-push`** (на раннере GitHub, не на VPS) — собирает
   `Dockerfile`, пушит образ в `ghcr.io/elf1movv/tasktracker` тегами
   `:latest` и `:<sha>`. Логинится в GHCR через `GITHUB_TOKEN` —
   выдаётся автоматически GitHub Actions, отдельно настраивать не нужно
   (только `permissions: packages: write` в самом workflow-файле)
2. **`deploy`** (`needs: build-and-push`) — SSH на VPS (отдельный
   deploy-ключ, не личный SSH-ключ владельца — добавлен в
   `/home/deploy/.ssh/authorized_keys` вторым по счёту), выполняет
   ровно те же команды, что и в разделе "Ручной передеплой" выше

Требует три GitHub Secret (Settings → Secrets and variables → Actions →
New repository secret) — добавлены владельцем репозитория вручную,
не через CI, новых секретов для перехода на Docker не понадобилось:
- `VPS_HOST` = `185.65.202.121`
- `VPS_USER` = `deploy`
- `VPS_SSH_KEY` = приватный ключ deploy-пары (не личный `id_ed25519`
  пользователя) — сгенерирован специально для CI, публичная половина уже
  на сервере

Если этот ключ когда-нибудь утечёт — просто удалить его строку из
`/home/deploy/.ssh/authorized_keys` на сервере и сгенерировать новую
пару, не трогая личный доступ владельца по SSH.

## Статус

- Гранулярный API (см. `docs/ARCHITECTURE.md`) — задеплоен и проверен в
  проде 2026-09-16
- Переход на Docker-деплой (приложение) — сделан и проверен в проде
  2026-09-16: образ собирается в GitHub Actions, пушится в GHCR (пакет
  публичный), VPS только `pull` + `up -d`; старый `tasktracker.service`
  удалён; переживание перезагрузки VPS проверено; автодеплой через пуш
  в `main` проверен end-to-end
- Контейнеризация PostgreSQL — сделана и проверена в проде 2026-09-17:
  реальные продовые данные перенесены (репетиция на копии → реальное
  переключение с построчной сверкой количества записей на каждом шаге
  → пост-деплой верификация), сеть переведена на bridge, backup-скрипт
  переписан под контейнер и протестирован (создание + восстановление в
  отдельный контейнер), переживание перезагрузки VPS проверено с обоими
  контейнерами. Нативный PostgreSQL остановлен, но **не удалён** — как
  минимум до начала октября 2026 (двухнедельный период наблюдения),
  данные на диске нетронуты как страховка отката
