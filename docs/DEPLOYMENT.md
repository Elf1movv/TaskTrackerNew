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
выбор, см. `docs/ARCHITECTURE.md` и историю решений. Всё своё: свой
Docker-контейнер с приложением, своя PostgreSQL (нативно, не в
контейнере — осознанно, см. `docs/ROADMAP.md`), свой nginx на своём VPS.

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
- **PostgreSQL 16** — через apt, кластер БД в `/var/lib/postgresql/16/main`,
  нативно на хосте (не в контейнере)
- **nginx** — через apt, версия 1.24
- **certbot** + `python3-certbot-nginx` — для HTTPS, уже запущен и
  настроен (см. раздел "nginx: reverse proxy + HTTPS" ниже)

## База данных

- БД: `tasktracker`, пользователь: `tasktracker` (отдельный от системного
  `postgres`)
- Пароль сгенерирован случайно на сервере и лежит **только на сервере**
  в `/home/deploy/db_url.txt` (chmod 600, владелец `deploy`) — не в git,
  не в чате
- Строка подключения (`DATABASE_URL`) собирается из этого файла и кладётся
  в `server/.env` на сервере

### Бэкапы

Скрипт `/home/deploy/backup-db.sh` на сервере, запускается ежедневно в
03:00 через `crontab -l` (пользователь `deploy`):

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR=/home/deploy/backups
mkdir -p "$BACKUP_DIR"

export $(grep DATABASE_URL /var/www/tasktracker/server/.env | xargs)

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/tasktracker_${TIMESTAMP}.sql.gz"

# Храним последние 14 бэкапов, остальные удаляем
ls -1t "$BACKUP_DIR"/tasktracker_*.sql.gz | tail -n +15 | xargs -r rm --
```

Бэкапы лежат в `/home/deploy/backups/`, хранится последние 14 штук.
**Ограничение**: бэкапы на том же сервере, что и сама БД — не защищают
от потери VPS целиком, только от случайной порчи данных на живом
сервере. Восстановление и рекомендация по скачиванию бэкапов на свой
компьютер — `PROJECT_BRAIN.md`, раздел 6.4.

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
DATABASE_URL="postgresql://tasktracker:<пароль>@localhost:5432/tasktracker"
PORT=3001
```

## Docker: образ и контейнер

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
pull` без учётных данных для реестра.

`docker-compose.yml` (в корне репозитория, доезжает до VPS через
`git pull`, лежит в `/var/www/tasktracker/docker-compose.yml`):
```yaml
services:
  app:
    image: ghcr.io/elf1movv/tasktracker:latest
    container_name: tasktracker
    network_mode: host
    restart: unless-stopped
    env_file:
      - server/.env
```

`network_mode: host` — контейнер работает в сетевом пространстве самого
VPS: достаёт PostgreSQL через `127.0.0.1:5432`, слушает `3001` напрямую,
точно как раньше bare-процесс — **nginx не тронут вообще**. Плата за
эту простоту: изнутри контейнера видны все сетевые интерфейсы хоста, не
только его собственные — приемлемо для одного доверенного контейнера на
своём VPS, но при контейнеризации Postgres (следующий шаг, см.
`docs/ROADMAP.md`) стоит будет пересмотреть на bridge-сеть.

`restart: unless-stopped` — сам Docker перезапускает контейнер при
падении и после перезагрузки VPS (проверено: `sudo reboot`, контейнер
поднялся сам, без вмешательства) — отдельный systemd-юнит для этого
больше не нужен (старый `tasktracker.service` удалён, см. ниже).

Управление:
```bash
docker compose -f /var/www/tasktracker/docker-compose.yml ps
docker compose -f /var/www/tasktracker/docker-compose.yml logs -f
docker compose -f /var/www/tasktracker/docker-compose.yml restart
```

**Известный gotcha при первой миграции (2026-09-16)**: старый
`tasktracker.service` (bare-процесс) и новый контейнер несколько минут
одновременно боролись за порт `3001` (оба слушают `0.0.0.0:3001` через
`network_mode: host`) — контейнер уходил в restart-loop с растущим
backoff, пока старый systemd-юнит не был явно остановлен
(`sudo systemctl stop tasktracker`). Если когда-нибудь понадобится
переносить деплой на новый VPS — сначала полностью убедиться, что
ничего больше не слушает `3001`, прежде чем поднимать контейнер.

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
- Переход на Docker-деплой — сделан и проверен в проде 2026-09-16:
  образ собирается в GitHub Actions, пушится в GHCR (пакет публичный),
  VPS только `pull` + `up -d`; старый `tasktracker.service` удалён;
  переживание перезагрузки VPS проверено (`sudo reboot` → контейнер
  поднялся сам); автодеплой через пуш в `main` проверен end-to-end
- PostgreSQL пока нативный (не в контейнере) — осознанно, следующий шаг
  из `docs/ROADMAP.md`
