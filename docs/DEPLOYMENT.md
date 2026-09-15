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
- **Домен**: пока не куплен (используется голый IP, без HTTPS)

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
  (HTTPS будущего сертификата)

## Установленное ПО (через apt / официальные репозитории)

- **Node.js** — LTS, через NodeSource (`deb.nodesource.com/setup_lts.x`)
- **PostgreSQL 16** — через apt, кластер БД в `/var/lib/postgresql/16/main`
- **nginx** — через apt, версия 1.24
- **certbot** + `python3-certbot-nginx` — для HTTPS (ещё не запускался,
  ждёт покупки домена)

## База данных

- БД: `tasktracker`, пользователь: `tasktracker` (отдельный от системного
  `postgres`)
- Пароль сгенерирован случайно на сервере и лежит **только на сервере**
  в `/home/deploy/db_url.txt` (chmod 600, владелец `deploy`) — не в git,
  не в чате
- Строка подключения (`DATABASE_URL`) собирается из этого файла и кладётся
  в `server/.env` на сервере

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

## nginx: reverse proxy

Конфиг `/etc/nginx/sites-available/tasktracker` (симлинк в
`sites-enabled`), `default`-сайт отключён:

```nginx
server {
    listen 80;
    server_name 185.65.202.121;

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
}
```

**Когда купим домен**: заменить `server_name` с IP на домен, затем
`sudo certbot --nginx -d <домен>` — сам получит сертификат Let's Encrypt
и допишет HTTPS-блок + редирект с HTTP в этот же файл.

Проверка конфига перед reload — всегда: `sudo nginx -t`, потом
`sudo systemctl reload nginx`.

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

## Что ещё не сделано (см. план деплоя)

- Покупка домена (reg.ru) — в процессе
- DNS A-запись на домен → `185.65.202.121`
- `certbot --nginx -d <домен>` для HTTPS
- GitHub Actions (`.github/workflows/deploy.yml`) — автодеплой при пуше в
  `main`, включая SSH-подключение по отдельному deploy-ключу (не
  личному), сохранённому в GitHub Secrets (`VPS_HOST`, `VPS_USER`,
  `VPS_SSH_KEY`)
