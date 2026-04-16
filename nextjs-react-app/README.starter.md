# $${name_pretty}

Static Next.js marketing site for $${name_pretty}.

## Development

```sh
npm install
npm run dev
```

## Static Export

```sh
npm run build
npm start
```

`npm run build` writes the static site to `out/`. Set `NEXT_PUBLIC_SITE_URL` at build time to control canonical, Open Graph, robots, and sitemap URLs. The default is `$${site_url}`.
