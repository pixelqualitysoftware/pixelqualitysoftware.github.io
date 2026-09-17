# Pixel Quality Software

A Jekyll site for Pixel Quality's projects and team.

## Local preview

Install Ruby 3.4+ and Bundler (`gem install bundler`), then run:

```sh
./run.sh
```

Open http://127.0.0.1:4000. The script installs missing gems into
`vendor/bundle`, builds the site, and starts a server with automatic rebuilds
and browser live reload. Stop it with Ctrl+C. The first run needs internet
access and may need your OS's compiler/build tools for native Ruby gems.

For a Codespace or container, bind to all interfaces and forward port 4000:

```sh
JEKYLL_HOST=0.0.0.0 ./run.sh
```

Change the port with `JEKYLL_PORT=4001 ./run.sh`. Extra arguments pass through
to Jekyll, for example `./run.sh --force_polling` for mounted filesystems.
Live reload uses port 35729; forward that port too when testing remotely.
Restart the server after editing `_config.yml`.

## Editing and building

- `index.html`: homepage content, with Jekyll front matter.
- `_layouts/default.html`: shared document head and page layout.
- `_includes/`: header and footer.
- `index.css`, `index.js`, `assets/`: styling, interactions, and local assets.
- `_config.yml`: site metadata and deployment `baseurl` (e.g. `/pixel-quality-web`).

After running the script once, build without starting a server:

```sh
BUNDLE_PATH=vendor/bundle bundle exec jekyll build
```

Generated files go into `_site/`. Commit `Gemfile.lock` to keep gem versions
consistent; generated output and installed dependencies are ignored by Git.

[Jekyll command documentation](https://jekyllrb.com/docs/usage/)

## Projects and team members

Cards are generated from `_projects/*.md` and `_team/*.md`, sorted alphabetically
by project title or member name. Add a Markdown file with YAML front matter to add a card;
remove its file to remove it. The team count updates automatically. These
collections supply homepage cards, not separate detail pages.

Project example (`_projects/my-project.md`):

```markdown
---
title: My Project
status: In development
summary: A short project description.
repository: https://github.com/pixelqualitysoftware/my-project
---
Write the project description here. **Markdown** is supported.
```

`status` and `repository` are optional. All card links use standard underlined hyperlinks. Project cards show the title and status without logos.

Member example (`_team/new-member.md`):

```markdown
---
name: New Member
role: Developer
profile: https://github.com/username
link_url: https://github.com/username
link_label: View GitHub profile
---
Write the member’s biography here.
```

`profile`, `link_url`, and `link_label` are optional. Shared card markup lives in
`_includes/project-card.html` and `_includes/member-card.html`. Restart an
already-running preview once after this migration so Jekyll loads the new
collection configuration; subsequent content edits rebuild automatically.

On desktop, overflowing card rows form a continuous, automatically looping gallery.
Galleries span the screen with wide fades at both edges.
The gallery moves continuously during scrolling, hovering, clicking, and focus.
Reduced-motion preferences disable autoplay. Mobile cards remain stacked.

Team avatars load automatically from the GitHub username in `profile`. No token
or separate image field is needed. Non-GitHub profiles and failed image loads
show the member’s initial instead.

## SEO and link previews

`jekyll-seo-tag` generates page titles, descriptions, canonical links, Open Graph
metadata, Twitter large-image cards, and JSON-LD structured data.
`jekyll-sitemap` generates `sitemap.xml`; `robots.txt` links to it in production.

Before deployment, set `url` in `_config.yml` to the public HTTPS origin (without
a trailing slash) and `baseurl` to the deployment subfolder, or `""` at the root.
Then build for production:

```sh
JEKYLL_ENV=production BUNDLE_PATH=vendor/bundle bundle exec jekyll build
```

Local/development builds send `noindex, nofollow` and disallow robots. Use the
production command for the files you publish. Restart local previews after
configuration changes. The preview server is not started by the build command.

The default sharing image is `assets/images/social-preview.png` (1200 × 630).
Its editable source is `assets/images/social-preview.svg`; regenerate the PNG
when changing the design. Pages can override `title`, `description`, and `image`
in their front matter. Social services may cache old previews after deployment.
Search indexing and the final preview appearance are controlled by each service.

Optional search-console verification tokens belong under
`webmaster_verifications` in `_config.yml`; add only tokens issued for your site.
Collections currently render on the homepage and do not have separate indexed
project/member pages.
