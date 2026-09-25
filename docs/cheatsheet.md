# Все команды курса в одном месте

Эта страница нужна, когда вы уже прошли урок и просто забыли точную команду. Здесь нет объяснений «зачем» — они в модулях, ссылки стоят в каждом разделе.

Команды сгруппированы **по задаче**, а не по модулям: когда что-то срочно нужно, вы вспоминаете «мне надо посмотреть логи», а не «это было в девятом модуле».

!!! tip "Как искать по этой странице"
    Нажмите `Ctrl+F` и введите то, что делаете: «логи», «бэкап», «порт», «памяти». Либо воспользуйтесь поиском по сайту вверху страницы.

## Где вводить команды

Две среды на протяжении всего курса:

| Пометка в курсе | Что открыть | Как понять, что вы здесь |
|---|---|---|
| **PowerShell на вашем компьютере** | меню «Пуск» → PowerShell | приглашение вида `PS C:\Projects\...>` |
| **терминал сервера** | то же окно после `ssh ucheb` | приглашение вида `deploy@vps-12345:~$` |

Признак, который стоит запомнить: в конце приглашения сервера `$` — значит вы обычный пользователь, `#` — значит root, и это повод насторожиться.

Подробный разбор — в уроке [«Карта курса»](modules/m00/01-karta.md).

## Подключение к серверу и ключи

Подробности — [модуль 1, урок про SSH](modules/m01/03-ssh-kluchi.md).

**Где вводить:** PowerShell на вашем компьютере

```powershell
# посмотреть, какие ключи уже есть
ls $env:USERPROFILE\.ssh

# создать новый ключ
ssh-keygen -t ed25519 -C "uchebnyy-vps" -f $env:USERPROFILE\.ssh\id_ed25519_ucheb

# показать ПУБЛИЧНУЮ часть (её можно копировать куда угодно)
Get-Content $env:USERPROFILE\.ssh\id_ed25519_ucheb.pub

# войти с явным указанием ключа
ssh -i $env:USERPROFILE\.ssh\id_ed25519_ucheb deploy@203.0.113.10

# открыть файл с короткими именами серверов
notepad $env:USERPROFILE\.ssh\config

# войти по короткому имени из config
ssh ucheb
```

Содержимое `config` для короткого входа:

```
Host ucheb
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519_ucheb
```

## Осмотреться на сервере

Первые команды, когда непонятно, что происходит. [Модуль 1, Linux на минимуме](modules/m01/04-linux-minimum.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
whoami                      # кто я сейчас
pwd                         # где я сейчас
ls -la                      # что в этой папке, включая скрытое
df -h                       # сколько места на дисках
free -h                     # сколько памяти
uptime                      # сколько работает сервер и его загрузка
ps aux --sort=-%mem | head  # кто больше всех ест память
date                        # время сервера (важно для сертификатов)
```

## Пользователи, права и доступы

[Модуль 2, не работать под root](modules/m02/03-ne-root.md) и [модуль 14, ключи и роли](modules/m14/01-kluchi-i-roli.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
# создать пользователя и дать ему административные права
sudo adduser deploy
sudo usermod -aG sudo deploy
id deploy

# положить ему ключ и выставить права (без этого SSH откажется работать)
sudo mkdir -p /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# кто вообще может войти
wc -l ~/.ssh/authorized_keys
cat ~/.ssh/authorized_keys | awk '{print $NF}'
cut -d: -f1,3 /etc/passwd | awk -F: '$2 >= 1000 {print $1}'
getent group sudo
getent group docker

# кто входил последним
last -n 20
sudo journalctl -u ssh --since "7 days ago" --no-pager | grep Accepted | tail -20

# отозвать доступ
sudo find /home -name authorized_keys -exec sh -c 'echo "--- {}"; awk "{print \$NF}" {}' \;
sudo nano /home/ИМЯ/.ssh/authorized_keys
sudo deluser --remove-home ИМЯ
```

Проверка настроек входа:

```bash
sudo grep -E "PermitRootLogin|PasswordAuthentication" /etc/ssh/sshd_config
grep -R PasswordAuthentication /etc/ssh
systemctl restart ssh
```

!!! warning "Про перезапуск SSH"
    Никогда не закрывайте текущее окно, пока не проверили вход в **новом**. Если ошиблись в настройках, старое окно — единственный способ всё вернуть.

## Обновления системы

[Модуль 2, обновления](modules/m02/01-obnovleniya.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
sudo apt update          # обновить список пакетов
sudo apt upgrade -y      # установить обновления
sudo apt autoremove -y   # убрать ненужное
sudo apt clean           # почистить кеш пакетов
sudo reboot              # перезагрузка, если её просят

# автоматические обновления безопасности
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Файрвол и защита от перебора

[Модуль 2, файрвол и fail2ban](modules/m02/02-firewall-fail2ban.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
# базовая настройка: всё закрыто, кроме нужного
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# посмотреть и поправить
sudo ufw status
sudo ufw status numbered
sudo ufw delete allow 8080/tcp

# защита от перебора паролей
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
sudo nano /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
```

!!! danger "Порядок при включении файрвола"
    Сначала `sudo ufw allow OpenSSH`, только потом `sudo ufw enable`. В обратном порядке вы отрежете себе вход.

## Docker и Compose

[Модуль 3](modules/m03/03-dockerfile-compose.md) и [модуль 4](modules/m04/02-zapusk-i-avtopodyom.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
# установка (полный список — в лаборатории 3)
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker deploy   # после этого обязательно выйти и войти заново

# проверить, что всё на месте
docker version
docker compose version
sudo systemctl is-enabled docker
sudo systemctl enable docker
```

Ежедневная работа:

```bash
cd /opt/pulse

docker compose up -d --build      # собрать и запустить
docker compose up -d              # запустить
docker compose ps                 # что сейчас работает
docker compose stop               # остановить
docker compose start              # запустить остановленное
docker compose restart            # перезапустить
docker compose down               # остановить и убрать контейнеры
docker compose up -d --force-recreate   # перечитать .env
```

Если работаете со связкой Caddy, к каждой команде добавляется файл:

```bash
docker compose -f compose.caddy.yml up -d --build
docker compose -f compose.caddy.yml ps
docker compose -f compose.caddy.yml restart pulse
```

Заглянуть внутрь:

```bash
docker compose exec pulse env | grep PULSE      # какие переменные видит контейнер
docker inspect pulse --format '{{ .State.Status }}'
docker inspect pulse --format '{{ .HostConfig.RestartPolicy.Name }}'
docker inspect pulse --format '{{ range .Mounts }}{{ .Source }} -> {{ .Destination }}{{ println }}{{ end }}'
docker ps -a                                     # включая остановленные
docker rm -f имя_контейнера                      # убрать застрявший контейнер
```

## Логи

[Модуль 9, где смотреть](modules/m09/02-gde-smotret.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
cd /opt/pulse

docker compose logs --tail=50                      # последние 50 строк всего
docker compose logs pulse --tail=50 --timestamps   # только приложение, со временем
docker compose logs caddy --tail=80                # только вахтёр
docker compose logs pulse --tail=200 | grep ОШИБКА # поиск по логам
```

Логи самой системы:

```bash
sudo journalctl -u docker --since "30 min ago" --no-pager
sudo journalctl -u ssh --since "1 hour ago" --no-pager | tail -20
sudo dmesg -T | grep -i -E "killed process|out of memory"
sudo journalctl --disk-usage
```

## Сеть, порты и проверка сервиса

[Модуль 4, порты](modules/m04/03-porty.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
sudo ss -tulpn                  # кто какой порт слушает
sudo ss -tulpn | grep 8080      # конкретный порт
sudo ss -tlnp | grep '0.0.0.0'  # что торчит наружу — самое важное
curl -s ifconfig.me; echo       # какой у сервера внешний адрес

# проверить сервис изнутри
curl -s http://127.0.0.1:8080/health

# код ответа и время, без тела страницы
curl -s -o /dev/null -w "код %{http_code}, время %{time_total} сек\n" https://pulse.ваш-домен.ru/health

# запрос с меткой, чтобы найти его в логах
curl -s -H "X-Request-Id: proverka" http://127.0.0.1:8080/health
```

**Где вводить:** PowerShell на вашем компьютере

```powershell
ping 203.0.113.10
nslookup pulse.ваш-домен.ru
curl.exe http://203.0.113.10:8080/health
curl.exe -vI https://pulse.ваш-домен.ru 2>&1 | Select-String "expire"   # срок сертификата
```

!!! note "Слушает 127.0.0.1 — это хорошо"
    Если приложение слушает `127.0.0.1:8080`, снаружи к нему не подключиться, и так и задумано. Наружу смотрит только Caddy на портах 80 и 443.

## Домен, HTTPS и Caddy

[Модуль 5](modules/m05/03-https.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
# порты для сертификата должны быть открыты
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ss -tulpn | grep ':80 '

# если 80-й занят чужим сервером
sudo systemctl stop apache2 nginx
sudo systemctl disable apache2 nginx

# время должно быть верным, иначе сертификат не выпустится
date
timedatectl
sudo timedatectl set-ntp true

# запуск и разбор проблем с сертификатом
cd /opt/pulse
nano Caddyfile
docker compose -f compose.caddy.yml up -d --build
docker compose -f compose.caddy.yml logs caddy --tail=80
```

## Файлы, права и передача на сервер

[Модуль 4, файлы на сервере](modules/m04/01-fayly-na-servere.md).

**Где вводить:** PowerShell на вашем компьютере

```powershell
scp -r .\labs\pulse\* ucheb:/opt/pulse/                    # папку на сервер
scp .\labs\alerts\check-pulse.sh ucheb:/opt/pulse/         # один файл на сервер
scp ucheb:/tmp/pulse-data.tgz $env:USERPROFILE\Documents\  # с сервера к себе
```

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
sudo mkdir -p /opt/pulse
sudo chown deploy:deploy /opt/pulse       # папка принадлежит вам
sudo chown -R 10001:10001 /opt/pulse/data # папка данных принадлежит пользователю контейнера
chmod 600 .env                            # секреты читает только владелец
ls -la
ls -ld /opt/pulse
sudo du -sh /opt/pulse/data               # сколько весит
```

!!! warning "Самая частая ошибка курса"
    `Permission denied` в логах приложения почти всегда означает, что забыт `sudo chown -R 10001:10001 /opt/pulse/data`. Внутри контейнера работает пользователь с номером 10001, и папка должна принадлежать ему.

## Бэкап и восстановление

[Модуль 6](modules/m06/04-proverka-vosstanovleniya.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
# создать архив папки данных
tar -czf /tmp/pulse-data.tgz -C /opt/pulse data
ls -lh /tmp/pulse-data.tgz

# посмотреть, что внутри архива, НЕ распаковывая
tar -tzf /tmp/pulse-data.tgz

# готовый скрипт курса
chmod +x /opt/pulse/backup-pulse.sh
sh /opt/pulse/backup-pulse.sh
```

Восстановление:

```bash
cd /opt/pulse
sudo mv data data.broken          # старое не удаляем, а отодвигаем
sudo tar -xzf /tmp/restore.tgz
sudo chown -R 10001:10001 data
cat data/note.txt                 # проверяем, что вернулось нужное
docker compose -f compose.caddy.yml restart
sudo rm -rf /opt/pulse/data.broken   # только после проверки
```

**Где вводить:** PowerShell на вашем компьютере

```powershell
scp ucheb:/tmp/pulse-data-20260925-1610.tgz $env:USERPROFILE\Documents\
Get-ChildItem .\backups\ | Sort-Object LastWriteTime -Descending | Select-Object -First 3
```

!!! danger "Копия без проверки восстановления копией не считается"
    Порядок всегда один: отодвинуть старое → распаковать → проверить содержимое → и только потом удалять отодвинутое.

## Секреты

[Модуль 2, секреты](modules/m02/04-sekrety.md) и [модуль 7](modules/m07/01-tri-sredy.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
cd /opt/pulse
cp .env.example .env
nano .env
chmod 600 .env
ls -l .env

# отдельный файл для скрипта уведомлений
nano /opt/pulse/alert.env
chmod 600 /opt/pulse/alert.env
```

**Где вводить:** PowerShell на вашем компьютере

```powershell
copy .env.example .env
git check-ignore -v .env                    # пусто = файл МОЖЕТ уехать в репозиторий
Get-Content .gitignore | Select-String "env"
Select-String -Path .\* -Pattern "api_key|token|password|sk-" -SimpleMatch
git log --all --full-history -- "**/.env"   # не попадал ли секрет в историю
git grep -I -n "BEGIN OPENSSH"
git grep -I -n "AKIA"
```

!!! danger "Если секрет попал в историю"
    Удалить файл недостаточно — история хранит всё. Ключ считается украденным: его надо заменить, а не спрятать.

## Git и публикация учебника

[Модуль 8](modules/m08/01-git-istoriya.md).

**Где вводить:** PowerShell на вашем компьютере, в папке проекта

```powershell
.\.venv\Scripts\Activate.ps1    # включить окружение проекта
mkdocs serve                    # смотреть курс на 127.0.0.1:8000
mkdocs build --strict           # собрать и проверить все ссылки

git init
git status
git status --short
git add .
git commit -m "Понятное описание изменения"
git log --oneline -10

git remote add origin https://github.com/ВАШ_ЛОГИН/DevOPS_SRE_course.git
git branch -M main
git push -u origin main

# автопубликация учебника
mkdir -Force .github\workflows
copy .\labs\ci\pages.yml .github\workflows\pages.yml

# проверки перед публикацией
git ls-files | Select-String -Pattern "\.env$|id_ed25519|\.pem$"
git status --ignored --short | Select-String "\.env|\.venv|site/"
```

Откат версии приложения на сервере:

```bash
cd /opt/pulse
git log --oneline -5
git checkout ИДЕНТИФИКАТОР_ВЕРСИИ
docker compose -f compose.caddy.yml up -d --build
```

## Алерты, Telegram и расписание

[Модуль 11](modules/m11/03-telegram-i-n8n.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

```bash
# подготовка скрипта проверки
cd /opt/pulse
cp alert.env.example alert.env
chmod 600 alert.env
chmod +x check-pulse.sh
nano alert.env

# проверить связь с ботом вручную
set -a; . /opt/pulse/alert.env; set +a
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=проверка связи"; echo

# запустить проверку руками
sh /opt/pulse/check-pulse.sh
echo "код возврата: $?"

# расписание
crontab -e
crontab -l
tail -20 /opt/pulse/alert-state/cron.log
```

Строка расписания, которая проверяет сервис каждые две минуты:

```
*/2 * * * * /bin/sh /opt/pulse/check-pulse.sh >> /opt/pulse/alert-state/cron.log 2>&1
```

Узнать свой идентификатор чата: напишите боту любое сообщение и откройте в браузере

```
https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates
```

## Когда что-то сломалось

Порядок действий — в карточках [сайт не открывается](runbooks/site-down.md), [диск кончается](runbooks/disk-full.md), [сертификат истекает](runbooks/ssl-expiring.md).

**Где вводить:** терминал сервера (`ssh ucheb`)

Четыре команды, с которых начинается любой разбор:

```bash
free -h                       # хватает ли памяти
df -h /                       # хватает ли места
docker compose ps             # работают ли контейнеры
docker compose logs --tail=50 # что они пишут
```

Закончилась память:

```bash
docker stats --no-stream
sudo dmesg -T | grep -i "out of memory" | tail -5
ps aux --sort=-%mem | head
```

Закончилось место:

```bash
df -h
sudo du -h -d 1 /var/lib/docker 2>/dev/null
sudo du -sh /var/log
docker system df
docker image prune            # убрать образы, которыми никто не пользуется
sudo journalctl --disk-usage
sudo journalctl --vacuum-size=50M
```

!!! danger "Осторожно с очисткой Docker"
    `docker image prune` без дополнительных ключей безопасен — он трогает только образы.

    А вот команды с ключом `--volumes` удаляют **тома вместе с данными**. Никогда не выполняйте их на сервере, где лежит что-то нужное.

Измерить, не стало ли медленнее:

```bash
for i in 1 2 3; do
  curl -s -o /dev/null -w "%{time_total}\n" https://pulse.ваш-домен.ru/health
done
uptime
```

**Где вводить:** PowerShell на вашем компьютере

```powershell
1..20 | ForEach-Object {
  $t = Measure-Command {
    Invoke-WebRequest -Uri "https://pulse.ваш-домен.ru/health" -UseBasicParsing | Out-Null
  }
  "{0,2}: {1:N0} мс" -f $_, $t.TotalMilliseconds
}
```

## Туннель к закрытой панели

[Модуль 14, админки и туннель](modules/m14/02-adminki-i-tunnel.md).

**Где вводить:** PowerShell на вашем компьютере

```powershell
# пока окно открыто, адрес 127.0.0.1:3000 у вас ведёт на сервер
ssh -L 3000:127.0.0.1:3000 ucheb

# потренироваться на знакомом сервисе
ssh -L 9999:127.0.0.1:8080 ucheb
```

Так админки открывают себе, не выставляя их в интернет.

## Kubernetes — только в песочнице

[Модуль 18](modules/m18/02-sushchnosti.md). На учебный сервер ничего не ставим.

```bash
kubectl get pods                 # список копий приложения
kubectl -n pulse get pods        # то же в своей зоне
kubectl describe pod ИМЯ         # почему копия не запускается
kubectl logs ИМЯ                 # логи копии
kubectl delete pod ИМЯ           # удалить — и увидеть, как поднимется новая
kubectl apply -f файл.yaml       # применить описание
```

**Где вводить:** PowerShell на вашем компьютере, если поднимали локальный кластер

```powershell
kind create cluster --name uchebnyy
kubectl -n pulse port-forward svc/pulse 8080:8080
kind delete cluster --name uchebnyy   # обязательно в конце
```

## Команды, которые могут навредить

Эти команды встречаются в курсе, но каждая требует паузы перед нажатием Enter.

| Команда | Что сделает | Перед выполнением |
|---|---|---|
| `sudo ufw enable` | включит файрвол | убедиться, что `allow OpenSSH` уже есть |
| `systemctl restart ssh` | применит настройки входа | не закрывать текущее окно, проверить вход в новом |
| `sudo rm -rf ...` | удалит без возврата | прочитать путь вслух целиком |
| `docker compose down` | остановит и уберёт контейнеры | данные в томах останутся, но сайт ляжет |
| `docker system prune --volumes` | удалит тома с данными | **не выполнять на сервере с данными** |
| `sudo deluser --remove-home ИМЯ` | удалит пользователя и его файлы | сначала забрать нужное из его папки |
| `git checkout ВЕРСИЯ` | вернёт старый код | не вернёт данные, это другой откат |
| `sudo reboot` | перезагрузит сервер | сайт будет недоступен минуту-две |

## Шпаргалка в одну строку

Самое частое, чтобы не листать:

| Задача | Команда |
|---|---|
| Войти на сервер | `ssh ucheb` |
| Жив ли сервис | `curl -s http://127.0.0.1:8080/health` |
| Что работает | `cd /opt/pulse && docker compose ps` |
| Что пишет | `docker compose logs --tail=50` |
| Хватает ли памяти | `free -h` |
| Хватает ли места | `df -h /` |
| Что торчит наружу | `sudo ss -tlnp \| grep '0.0.0.0'` |
| Какие порты открыты | `sudo ufw status` |
| Перезапустить | `docker compose restart` |
| Сделать копию | `sh /opt/pulse/backup-pulse.sh` |
| Собрать учебник | `mkdocs build --strict` |
