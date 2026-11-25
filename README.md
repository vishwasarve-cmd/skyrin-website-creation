# Skyrin Engineering website

A small static website made with plain HTML, CSS and JavaScript. There is no build step and nothing to install.

```
index.html        the whole page (all text lives here)
css/styles.css    colours, layout, fonts
js/main.js        menu, project filter, form, tracking  (SETTINGS are at the top)
assets/           logo and project images
robots.txt        tells search engines what to crawl
sitemap.xml       list of pages for Google
vercel.json       hosting settings for Vercel
```

## 1. Try it on your computer

Double-click `index.html`. It opens in your browser. That is all.

## 2. Put it on GitHub

**Easiest way (no commands):**
1. Sign in at github.com, click **New repository**, name it `skyrin-website`, choose **Private**, click **Create repository**.
2. On the new page click **uploading an existing file**.
3. Unzip this folder on your computer, then drag **everything inside it** (index.html, css, js, assets and the rest) into the browser window.
4. Click **Commit changes**.

**With Git commands (inside this folder):**
```
git init
git add .
git commit -m "First version of Skyrin website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/skyrin-website.git
git push -u origin main
```

## 3. Deploy on Vercel

1. Sign in at vercel.com with your GitHub account.
2. Click **Add New**, then **Project**, and choose the `skyrin-website` repository.
3. Leave every setting as it is (Framework Preset: **Other**, no build command, no output directory). Click **Deploy**.
4. In about a minute you get a link like `skyrin-website.vercel.app`.

From now on, every change you commit to GitHub is published automatically.

## 4. Settings to change (top of `js/main.js`)

| Setting | What to do |
|---|---|
| `WEB3FORMS_KEY` | Get a free key at web3forms.com using the email that should receive enquiries, and paste it in. Until then the form opens the visitor's email app. |
| `GTM_ID` | Paste your Google Tag Manager ID (GTM-XXXXXXX). Then add Google Analytics 4 and Microsoft Clarity inside Tag Manager. Leave empty for no tracking. |
| `WHATSAPP` | The WhatsApp number, digits only with country code. |
| `SHOW_CLIENT_NAMES` | Set to `false` to hide every client name until each client approves. |

## 5. Before going live on the real domain

- [ ] In `index.html`, delete the line `<meta name="robots" content="noindex, nofollow">` (it keeps Google away from the demo).
- [ ] Confirm the main address (www or non-www). It appears in the `canonical` link, the `og:url` tag, the schema block in `index.html`, and in `sitemap.xml` and `robots.txt`.
- [ ] In Vercel, open the project, then **Settings, Domains**, and add the domain.
- [ ] Check the text marked in the notes below.

## Content to confirm with the team

The wording was taken from the earlier demo. Please confirm before launch:
- The numbers in the blue hero strip: 100+ projects, 4+ years, 7 disciplines, 24 hour reply.
- That each client may be named (or switch `SHOW_CLIENT_NAMES` off).
- The phone numbers, emails and office addresses.
- The "Ways to work with us" descriptions.
- Add real client testimonials and certifications when you have permission. Trust proof helps enquiries.

## How enquiries are tracked

When someone arrives from a tagged link (for example `?utm_source=whatsapp&utm_medium=message&utm_campaign=...`), the site remembers it for that visit and:
- sends the source, landing page and referrer with every quote request,
- adds the source to the WhatsApp message text,
- records form, WhatsApp, phone and email clicks as events in Tag Manager (only after the visitor accepts cookies).
