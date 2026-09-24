# n-uf.com

Organisation homepage for [n-uf](https://github.com/n-uf). Static site. Production branch is `main`. Host is Vercel.

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Astro 5 |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Language | TypeScript, strict |
| Package manager | pnpm |
| Output | Fully static |
| Sitemap | `@astrojs/sitemap` |
| Host | Vercel, production branch `main` |
| Node | 20 or newer (`.nvmrc`) |

Project copy lives in `src/data/projects.ts`. The homepage grid and `llms.txt` both render from that file.

## Run locally

```sh
pnpm install
pnpm dev
```

## Build

```sh
pnpm build
pnpm preview
```

`pnpm build` writes `dist/`, including `dist/llms.txt` and `dist/sitemap-index.xml`.

## DNS cut-over

The apex `n-uf.com` currently resolves to Squarespace / Google Domains parking:

- `A` `13.248.243.5`
- `A` `76.223.105.230`
- HTTPS `Server: DPS`

`www.n-uf.com` returns `301` to the apex.

These names already `CNAME` to `*.vercel-dns-017.com` and must stay as they are:

- `hypr-tiling.n-uf.com`
- `doodl.n-uf.com`
- `preview.doodl.n-uf.com`
- `debugsy.n-uf.com`

Cut the apex over as follows.

1. In Vercel, create a project from the GitHub repo `n-uf/n-uf.com`. Set the production branch to `main`.
2. In that project, add the domains `n-uf.com` and `www.n-uf.com`. Set `www.n-uf.com` to redirect to the apex `n-uf.com`.
3. At the registrar, replace the parking records for the apex and `www` only:
   - apex `n-uf.com`: `A` `76.76.21.21`
   - `www`: `CNAME` `cname.vercel-dns.com`
4. Leave the four product subdomain `CNAME` records untouched.
5. Verify:

```sh
dig +short n-uf.com
curl -sI https://n-uf.com | grep -i server
```

`dig` should return `76.76.21.21`. The `Server` header should be `Vercel`.
