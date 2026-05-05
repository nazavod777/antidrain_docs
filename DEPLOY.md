# Deploy Instructions

This project is a legacy GitBook 3.2.3 site. Build it with Node 10, then publish the generated `_book` directory to the `gh-pages` branch.

## Build

```bash
PATH="/home/nazavod/.nvm/versions/node/v10.24.1/bin:$PATH" gitbook build
```

Do not build with Node 18/22. GitBook may clean `_book` without generating pages while returning exit code 0.

## Publish Source Changes

```bash
git add .
git commit -m "Update docs"
git push origin main
```

## Publish Built Site

```bash
rm -rf /tmp/opencode/antidrain-gh-pages
git clone /home/nazavod/workWORKWORKworkWORK/antidrain_docs /tmp/opencode/antidrain-gh-pages

cd /tmp/opencode/antidrain-gh-pages
git remote set-url origin https://github.com/nazavod777/antidrain_docs.git
git checkout --orphan gh-pages
git rm -rf . >/dev/null
rsync -a /home/nazavod/workWORKWORKworkWORK/antidrain_docs/_book/ ./
printf 'docs.antidrain.me\n' > CNAME
touch .nojekyll
git add .
git commit -m "Deploy GitBook site"
git push -u origin gh-pages --force
```

GitHub Pages is configured for:

- Domain: `https://docs.antidrain.me/`
- Source branch: `gh-pages`
- Source path: `/`

The `main` branch includes `.github/workflows/deploy.yml`, which publishes the `gh-pages` branch via GitHub Pages Actions. After pushing `gh-pages`, pushing or dispatching the workflow can refresh Pages deployment.

## Verify

```bash
gh run list --repo nazavod777/antidrain_docs --workflow "Deploy Docs Site" --limit 5
curl -I "https://docs.antidrain.me/?v=$(date +%s)"
curl -L "https://docs.antidrain.me/?v=$(date +%s)" --max-time 20
```

Expected:

- `HTTP/2 200`
- HTML contains `GitBook 3.2.3`
- New `last-modified` header after deployment
