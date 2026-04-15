# $${name_pretty}

This workspace contains a generated Django API package, the shared API core runtime, reusable auth/UI packages, a React web app, and deployment tooling.

## Local Setup

Run:

```bash
./scripts/setup.sh
```

The setup script syncs the Multi workspace, prepares the Django runtime, and installs frontend packages when `with_frontend` is enabled.

Common entry points:

- `api`: generated Django app package for project-specific backend code
- `api-core`: shared Django runtime and settings skeleton
- `api-client`: generated Orval TypeScript client package
- `auth-client`: reusable django-allauth React client
- `ui`: shared React UI package
- `web`: React frontend
- `deploy`: deployment CLI and Terraform stack

## Deployment

Use the `deploy` repo and the `openbase-deploy` CLI for AWS/Terraform/ECS deployment.

Deployment metadata is stored outside the repo:

```text
~/.openbase/deployments/<stack-name>/<environment>/deployment.toml
```

Initialize metadata for a new stack:

```bash
openbase-deploy init-stack $${name_kebab} prod \
  --web-hostname app.example.com \
  --cdn-hostname assets.example.com \
  --cloudflare-zone-name example.com \
  --web-command "/app/.venv/bin/gunicorn config.asgi:application --log-file - -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000" \
  --worker-command "/app/.venv/bin/taskiq worker --log-level=INFO --max-threadpool-threads=2 config.taskiq_config:broker config.taskiq_tasks" \
  --deploy-command "/app/.venv/bin/python manage.py migrate" \
  --app-requirement git+https://github.com/$${github_user}/$${name_kebab}-api
```

Then deploy:

```bash
openbase-deploy build $${name_kebab} prod --app-dir web
OPENBASE_DEPLOY_DB_PASSWORD='...' openbase-deploy apply $${name_kebab} prod --auto-approve
CLOUDFLARE_API_TOKEN='...' openbase-deploy cloudflare-setup $${name_kebab} prod
openbase-deploy deploy $${name_kebab} prod
```

The deployment stack is always web + worker. The deploy one-off command is metadata, so Django migrations are a project choice rather than behavior hard-coded into `openbase-deploy`.
