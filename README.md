# DevOps и SRE с нуля

Авторский курс: как безопасно выкладывать свои проекты на сервер в РФ, замечать поломки раньше пользователей и понимать, зачем нужны Kubernetes и облака.

Сайт-учебник. Читать можно с телефона и компьютера. Практику на VPS удобнее делать с компьютера.

## Открыть курс на Windows (PowerShell)

Нужен Python 3.11+.

```powershell
cd "C:\Projects\DevOPS_SRE_course"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
mkdocs serve
```

Откройте в браузере: [http://127.0.0.1:8000](http://127.0.0.1:8000)

Если PowerShell запрещает скрипт активации:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Mac / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
mkdocs serve
```

## Что уже готово

- Модули **0–19** — полный курс: от VPS до SRE, подписки, Kubernetes и AWS-грамотности.
- Kubernetes и AWS — теория, YAML и песочница. На VPS 1 ГБ их не ставить.
- Глоссарий, инвентарь, чеклист прода, три runbook-карточки.

## Важно

Не кладите в git файлы `.env`, ключи SSH, папки `.venv` и `site/`.
