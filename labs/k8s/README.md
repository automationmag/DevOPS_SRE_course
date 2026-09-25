# «Пульс» в Kubernetes — те же роли, что в Compose

Не запускайте это на учебном VPS 1 ГБ. Читайте рядом с `labs/pulse/compose.yml` и применяйте в браузерной песочнице или на машине ≥ 4 ГБ.

Соответствие:

| Compose | Kubernetes |
|---|---|
| проект в /opt/pulse | Namespace |
| environment / несекретный .env | ConfigMap |
| секретный .env | Secret |
| ./data:/data | PersistentVolumeClaim |
| service pulse + restart | Deployment (+ ReplicaSet + Pod) |
| имя сервиса pulse в сети | Service |
| Caddy + домен | Ingress (+ сертификат) |
| mem_limit: 64m | resources.limits.memory |
| curl /health руками | liveness/readiness probes |
