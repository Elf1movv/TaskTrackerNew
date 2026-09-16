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
Node-процесс, своя PostgreSQL, свой nginx на своём VPS.

## Доступ

- Вход только по SSH-ключу, парольный вход и root-логин отключены
  (`PermitRootLogin no`, `PasswordAuthentication no` в
  `/etc/ssh/sshd_config`)
- Рабочий пользователь: `deploy` (в группе `sudo`, NOPASSWD настроен в
  `/etc/sudoers.d/`)
- Firewall: `ufw`, разрешены только порты 22 (SSH), 80 (HTTP), 443
  (HTTPS)

## Установленное ПО (через apt / официальные репозитории)

- **Node.js** — LTS, через NodeSource (`deb.nodesource.com/setup_lts.x`)
- **PostgreSQL 16** — через apt, кластер БД в `/var/lib/postgresql/16/main`
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

`/var/www/tasktracker/.env`:
```
VITE_API_URL=/api
```

`/var/www/tasktracker/server/.env`:
```
DATABASE_URL="postgresql://tasktracker:<пароль>@localhost:5432/tasktracker"
PORT=3001
```

## Сборка

```bash
cd /var/www/tasktracker
npm install
npm run build              # → dist/ (собранный фронтенд)

cd server
npm install
npx prisma migrate deploy  # применяет уже готовые миграции без вопросов
npm run build               # tsc → dist/index.js
```

## systemd: автозапуск и автоперезапуск бэкенда

Юнит `/etc/systemd/system/tasktracker.service`:

```ini
[Unit]
Description=TaskTracker Node/Express server
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/tasktracker/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Управление:
```bash
sudo systemctl status tasktracker
sudo systemctl restart tasktracker
sudo journalctl -u tasktracker -f   # логи в реальном времени
```

Сервер слушает только `127.0.0.1:3001` — снаружи напрямую недоступен,
только через nginx.

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

## Ручной передеплой (до появления CI/CD)

```bash
ssh deploy@185.65.202.121
cd /var/www/tasktracker
git pull
npm install && npm run build
cd server
npm install && npx prisma migrate deploy && npm run build
sudo systemctl restart tasktracker
```

## CI/CD: автодеплой при пуше в main

`.github/workflows/deploy.yml` — при пуше в `main`: SSH на VPS
(отдельный deploy-ключ, не личный SSH-ключ владельца — добавлен в
`/home/deploy/.ssh/authorized_keys` вторым по счёту), `git pull`,
`npm ci` + `npm run build` для фронтенда, то же самое плюс
`prisma migrate deploy` для `server/`, затем
`sudo systemctl restart tasktracker`.

Требует три GitHub Secret (Settings → Secrets and variables → Actions →
New repository secret) — добавляются владельцем репозитория вручную,
не через CI:
- `VPS_HOST` = `185.65.202.121`
- `VPS_USER` = `deploy`
- `VPS_SSH_KEY` = приватный ключ deploy-пары (не личный `id_ed25519`
  пользователя) — сгенерирован специально для CI, публичная половина уже
  на сервере

Если этот ключ когда-нибудь утечёт — просто удалить его строку из
`/home/deploy/.ssh/authorized_keys` на сервере и сгенерировать новую
пару, не трогая личный доступ владельца по SSH.

## Статус

GitHub Secrets добавлены (2026-09-16). Этот самый коммит — первый
реальный тест автодеплоя: если он появился на проде через GitHub Actions,
а не через ручной `git pull` на сервере — значит, CI/CD работает.
