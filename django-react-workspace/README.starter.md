# $${name_pretty}

This workspace contains a generated Django API package, the shared API core runtime, reusable auth/UI packages, and a React web app.

## Local Setup

Run:

```bash
./scripts/setup.sh
```

The setup script syncs the Multi workspace, prepares the Django runtime, and installs frontend packages when `with_frontend` is enabled.
It also scaffolds the full auth screen set from `auth-client` into `web/src/auth/` on first setup, skipping files that already exist.

Common entry points:

- `api`: generated Django app package for project-specific backend code
- `api-core`: shared Django runtime and settings skeleton
- `api-client`: local ignored Orval TypeScript client package; run `pnpm --filter $${api_client_package_name} generate-client` after API schema changes
- `auth-client`: reusable django-allauth React client
- `ui`: shared React UI package
- `web`: React frontend

To refresh the local auth scaffold later:

```bash
pnpm auth:overwrite
```

The web package proxies `/api` and `/_allauth` to `VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:8000`, during Vite development. Its dev and build scripts first build the local generated `api-client` package so package exports resolve even when running web commands directly.

## Deployment

Use the shared `openbase-deploy` CLI for AWS/Terraform/ECS deployment.

Deployment metadata is stored outside the repo:

```text
~/.openbase/deployments/<stack-name>/deployment.toml
```

Initialize backend metadata for a new server stack:

```bash
openbase-deploy init server $${name_kebab} \
  --hostname app.example.com \
  --image-context-dir ./api-core \
  --web-command "/app/.venv/bin/gunicorn config.asgi:application --log-file - -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000" \
  --worker-command "/app/.venv/bin/taskiq worker config.taskiq_config:broker config.taskiq_tasks" \
  --deploy-command "/app/.venv/bin/python manage.py migrate" \
openbase-deploy image requirements add $${name_kebab} \
  "git+https://github.com/$${github_user}/$${name_kebab}-api.git@main"
```

Set required backend config through `openbase-deploy config set` or the
deployment environment. At minimum production needs `DJANGO_SECRET_KEY`,
`HEADLESS_JWT_PRIVATE_KEY`, `HEADLESS_JWT_ISSUER`, `DATABASE_URL`, and
`REDIS_URL`.

Build and deploy the backend:

```bash
openbase-deploy build $${name_kebab} --no-push
OPENBASE_DEPLOY_DB_PASSWORD='...' \
  openbase-deploy deploy $${name_kebab} --build-image --apply --cloudflare-setup --auto-approve
```

If the frontend should be hosted separately from the backend, initialize a
static-site stack:

```bash
openbase-deploy init static-site $${name_kebab}-web \
  --hostname assets.example.com \
  --source-dir ./web \
  --build-command "pnpm build" \
  --output-dir dist
openbase-deploy deploy $${name_kebab}-web --apply --auto-approve
```

Server and static-site stacks are independent. The deploy one-off command is
metadata, so Django migrations are a project choice rather than behavior
hard-coded into `openbase-deploy`.
