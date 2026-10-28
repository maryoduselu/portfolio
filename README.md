# Mary Oduselu: portfolio site

A portfolio for instructional design, web design and graphic design. All text lives in plain files in the `content` folder, so you can update the site without writing code.

Every time you save a change to this repository on GitHub, Netlify rebuilds the site and publishes it in about one to two minutes.

## How the site is organised

| What you want to change | File or folder |
| --- | --- |
| Name, contact details, bio, hero text, services, process, social links | `content/site.json` |
| Skills lists | `content/skills.json` |
| Jobs, education, certifications | `content/experience.json` |
| Testimonials (the section appears only when this has entries) | `content/testimonials.json` |
| Your projects (one file per project) | `content/projects/` |
| Project templates to copy | `content/_templates/` |
| Images, portraits, CV | `static/images/` and `static/` |
| Colours and fonts | top of `static/css/style.css` |

You never need to edit `build.mjs`. It turns your content into web pages.

## Everyday tasks

### Change a link, phone number or piece of text

1. On GitHub, open `content/site.json` (or the file listed above).
2. Click the pencil icon.
3. Change only the text between the quotation marks. Keep every comma, bracket and quote mark.
4. Click **Commit changes**.

If you make a typo, the build stops and Netlify's deploy log says which file and what to check. Your live site stays as it was until the next successful build.

### Add a project

1. Upload your images: open `static/images/`, choose **Add file > Upload files**, drop them in and commit. Use lowercase names with hyphens, for example `rise-course-cover.jpg`. Aim for about 1600 pixels wide and under 500 KB each.
2. Open the template that matches your project in `content/_templates/` and copy its text.
3. Go to `content/projects/`, choose **Add file > Create new file**, and name it after the project, for example `my-new-project.md`.
4. Paste the template and fill it in. The part between the two `---` lines is the project's details. Everything below is the case study, written with `##` headings.
5. Commit. The project appears on the home page and gets its own page.

Rules for the top section of a project file:

- `category` must be exactly `instructional-design`, `web-design` or `graphic-design`.
- `thumbnail` and `gallery` images start with `/images/`.
- Projects appear newest first by `date`. Add `order: 1` to pin a project to the top.
- Remove the line `placeholder: true` when the project has your own images.

### Show a course demo inside the page (instructional design)

Publish your Articulate Rise or Storyline course to a web address, then add these lines to the top section of the project file:

```
embed: https://your-published-course-address
embedTitle: Course demo
```

### Remove a project

Open its file in `content/projects/`, click the bin icon and commit.

### Replace or change the photos

Your two portraits are `static/images/mary-hero.jpg` (the dark hero card) and `static/images/mary-about.jpg` (the About section). To swap one, upload a new file with the same name to `static/images/`. To use a different file name, change `"photo"` under `"hero"` or `"about"` in `content/site.json`. Portrait photos about 1000 pixels wide and 4 by 5 in shape work best. The hero card works best with a dark background, as the current photo has.

The hero photo carries the photographer's small logo near the bottom edge. The status badge covers most of it, but check you have permission to use the photo.

### Add your CV

Upload your PDF to the `static` folder, name it `cv.pdf`, and set `"cv": "/cv.pdf"` in `content/site.json`. A Download my CV button then appears in the About section. Remember that anyone can open this file, so check what contact details it shows.

### Add social links

In `content/site.json`, add lines to `"social"`, for example:

```
{ "label": "LinkedIn", "url": "https://www.linkedin.com/in/your-name" }
```

### Hide the preview banner

When you have replaced the placeholder images, set `"showPlaceholderBanner"` to `false` in `content/site.json`.

### Turn the availability badge off

In `content/site.json`, set `"open"` to `false` (the dot turns grey) or change the text.

### Add a testimonial

Edit `content/testimonials.json`:

```
[
  {
    "quote": "What the person said about working with you.",
    "name": "Their name",
    "title": "Their role and organisation"
  }
]
```

Always ask permission before using someone's words and name.

## Contact form

The form uses Netlify Forms. After the first deploy, open your site in Netlify and go to **Forms** to read messages. To get an email for each message, add a form notification under **Forms > Form notifications**.

## Before you share the link

- [ ] Replace the placeholder project images (the grey, amber and charcoal drawings) with your own work.
- [ ] Add your real links where projects say `https://example.com`.
- [ ] Finish or delete each "Add more detail" section in the project files.
- [ ] Check every date, job title and number against your CV.
- [ ] Set `"showPlaceholderBanner"` to `false`.
- [ ] Add your site address as `"siteUrl"` in `content/site.json` (Netlify also supplies it automatically).
- [ ] Add a `seo.image` (a 1200 by 630 pixel JPG or PNG in `static/images/`) so links show a preview picture when shared.

## Run it on your computer (optional)

You need Node.js 18 or newer.

```
npm install
npm run build
npx serve dist
```

## Colours and fonts

The golden amber accent is set once, as `--amber` at the top of `static/css/style.css`. Change that hex value (and `--amber-bright` for hover) to restyle buttons, highlights, icons and the nav. `--amber-deep` is the darker version used for small text on light backgrounds, so keep it dark enough to read.

Headings use Fraunces and body text uses Plus Jakarta Sans. Both font files are bundled in `static/fonts`, so the site does not load anything from Google.
