// Builds the portfolio into the "dist" folder.
// Content comes from the "content" folder. Static files (css, js, images) come from "static".
// You normally never need to edit this file. Edit the files in "content" instead.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

/* ---------- friendly errors ---------- */

function fail(message) {
  console.error(`\nBUILD STOPPED\n${message}\n`);
  process.exit(1);
}

function readJSON(relPath, fallback) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (err) {
    fail(
      `There is a typo in ${relPath}.\n${err.message}\n` +
        'Check for a missing comma, quote mark or bracket near the place mentioned above.'
    );
  }
}

/* ---------- helpers ---------- */

const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Text between ** ** is shown in the accent colour.
const withAccent = (value = '') => esc(value).replace(/\*\*(.+?)\*\*/g, '<em class="accent">$1</em>');

const CATEGORIES = {
  'instructional-design': { label: 'Instructional design' },
  'web-design': { label: 'Web design' },
  'graphic-design': { label: 'Graphic design' }
};

const catLabel = (slug) => CATEGORIES[slug]?.label ?? slug;

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function toList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/* ---------- load content ---------- */

const site = readJSON('content/site.json');
if (!site) fail('content/site.json is missing.');
const skills = readJSON('content/skills.json', []);
const exp = readJSON('content/experience.json', { experience: [], certifications: [], education: [] });
const testimonials = readJSON('content/testimonials.json', []);

const baseUrl = (site.siteUrl || process.env.URL || '').replace(/\/$/, '');
const abs = (p) => (baseUrl && p && p.startsWith('/') ? baseUrl + p : p);
const shortName = site.shortName || site.name.split(' ')[0];

function loadProjects() {
  const dir = path.join(ROOT, 'content/projects');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_'));

  const list = files.map((file) => {
    let parsed;
    try {
      parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
    } catch (err) {
      fail(
        `The top section (between the two --- lines) of content/projects/${file} could not be read.\n${err.message}\n` +
          'Check the spacing, colons and quote marks in that section.'
      );
    }
    const data = parsed.data;
    const slug = file.replace(/\.md$/, '');
    if (!data.title) fail(`content/projects/${file} needs a "title:" line.`);
    if (!CATEGORIES[data.category]) {
      fail(
        `content/projects/${file} has category "${data.category}".\n` +
          `It must be exactly one of: ${Object.keys(CATEGORIES).join(', ')}`
      );
    }
    return {
      slug,
      ...data,
      date: data.date ? new Date(data.date) : new Date(0),
      tools: toList(data.tools),
      links: toList(data.links),
      gallery: toList(data.gallery).map((g) => (typeof g === 'string' ? { src: g } : g)),
      html: marked.parse(parsed.content || '')
    };
  });

  // Newest first. Projects with an "order" number come before the rest.
  return list.sort((a, b) => {
    const ao = a.order ?? Infinity;
    const bo = b.order ?? Infinity;
    if (ao !== bo) return ao - bo;
    return b.date - a.date;
  });
}

const projects = loadProjects();

/* ---------- shared page pieces ---------- */

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

const ICON_PATHS = {
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
  window: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  cap: '<path d="m22 9-10-5L2 9l10 5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>'
};
const CATEGORY_ICON = { 'instructional-design': 'book', 'web-design': 'window', 'graphic-design': 'pen' };

function icon(name) {
  const paths = ICON_PATHS[name] || ICON_PATHS.spark;
  return `<span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}

function head({ title, description, path: pagePath = '/', image, noindex = false }) {
  const canonical = baseUrl ? `${baseUrl}${pagePath}` : '';
  const img = abs(image || site.seo?.image || '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="${esc(site.name)}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
${img ? `<meta property="og:image" content="${esc(img)}">` : ''}
<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${img ? `<meta name="twitter:image" content="${esc(img)}">` : ''}
<meta name="theme-color" content="#0c0c0e">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/plus-jakarta-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/style.css">
<script>${themeScript}</script>
</head>`;
}

const NAV = [
  ['Home', '/#home'],
  ['Work', '/#work'],
  ['About', '/#about'],
  ['Services', '/#services'],
  ['Skills', '/#skills'],
  ['Experience', '/#experience'],
  ['Contact', '/#contact']
];

function banner() {
  if (!site.showPlaceholderBanner) return '';
  return `<div class="banner" role="note"><p>Preview mode: placeholder content is still on this site. Turn this note off in <code>content/site.json</code>.</p><button type="button" class="banner-close" aria-label="Hide this message">Hide</button></div>`;
}

function header() {
  const brand = site.brand || String(site.name).split(' ')[0];
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="pill-nav">
    <a class="brand" href="/" aria-label="${esc(site.name)}, home">${esc(brand)}<span>.</span></a>
    <nav id="site-nav" class="nav" aria-label="Main">
      <ul>
        ${NAV.map(([label, href]) => `<li><a href="${href}" data-nav="${href.split('#')[1]}">${label}</a></li>`).join('\n        ')}
      </ul>
    </nav>
    <button class="theme-btn" type="button" aria-label="Switch between light and dark mode">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>
    </button>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
  </div>
</header>`;
}

function footer() {
  const socials = (site.social || []).filter((s) => s.url);
  return `<footer class="site-footer">
  <div class="wrap foot">
    <div>
      <p class="foot-name">${esc(site.name)}</p>
      <p class="foot-role">${esc(site.role)}</p>
    </div>
    <ul class="foot-links">
      ${socials.map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join('\n      ')}
      ${site.email ? `<li><a href="mailto:${esc(site.email)}">Email</a></li>` : ''}
    </ul>
    <p class="foot-copy">&copy; ${new Date().getFullYear()} ${esc(site.name)}</p>
  </div>
</footer>
${banner()}
<dialog class="lightbox" aria-label="Image viewer">
  <button class="lb-close" type="button" aria-label="Close image">Close</button>
  <button class="lb-prev" type="button" aria-label="Previous image">Previous</button>
  <figure><img alt=""><figcaption></figcaption></figure>
  <button class="lb-next" type="button" aria-label="Next image">Next</button>
</dialog>
<script src="/js/main.js" defer></script>`;
}

function tag(category, extra = '') {
  return `<span class="tag"><i aria-hidden="true"></i>${esc(catLabel(category))}${extra}</span>`;
}

/* ---------- home page ---------- */

function projectCard(p) {
  return `<li class="card-item" data-category="${p.category}">
  <a class="card" href="/work/${p.slug}/">
    <div class="card-media">
      <img src="${esc(p.thumbnail || '/images/placeholder-generic.svg')}" alt="${esc(p.thumbnailAlt || p.title)}" width="1600" height="1000" loading="lazy">
    </div>
    <div class="card-body">
      <p class="card-meta">${tag(p.category)}${p.placeholder ? '<span class="ph">Placeholder</span>' : ''}</p>
      <h3>${esc(p.title)}</h3>
      <p class="card-summary">${esc(p.summary || '')}</p>
      ${p.tools.length ? `<ul class="chips">${p.tools.slice(0, 4).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    </div>
  </a>
</li>`;
}

function sectionHead(id, { eyebrow, heading, intro }) {
  return `<div class="section-head">
  ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
  <h2 id="${id}-title">${esc(heading)}</h2>
  ${intro ? `<p class="intro">${esc(intro)}</p>` : ''}
</div>`;
}

function homePage() {
  const hero = site.hero || {};
  const present = [...new Set(projects.map((p) => p.category))];
  const filterButtons = Object.keys(CATEGORIES).filter((c) => present.includes(c));
  const socials = (site.social || []).filter((s) => s.url);
  const nameLines = String(site.name).split(' ').map(esc).join('<br>');

  const heroSection = `<section class="hero" id="home" aria-labelledby="hero-title">
  <div class="wrap hero-inner">
    <div class="hero-copy">
      ${hero.eyebrow ? `<p class="pill-label"><i aria-hidden="true"></i>${esc(hero.eyebrow)}</p>` : ''}
      <h1 id="hero-title" class="hero-name">${nameLines}</h1>
      <p class="hero-tag">${esc(hero.intro || '')} <em>${esc(hero.highlight || '')}</em> ${esc(hero.rest || '')}</p>
      <p class="hero-lead">${esc(hero.lead || '')}</p>
      <ul class="disc-pills" aria-label="Disciplines">
        ${toList(hero.disciplines).map((c) => `<li><a href="#work" data-filter-link="${c}">${icon(CATEGORY_ICON[c])}${esc(catLabel(c))}</a></li>`).join('\n        ')}
      </ul>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#work">View my work <span aria-hidden="true">&#8599;</span></a>
        <a class="btn btn-ghost" href="#contact">Get in touch</a>
      </div>
      <p class="hero-meta">
        ${site.location ? `<span>${esc(site.location)}</span>` : ''}
        ${socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('\n        ')}
        ${site.email ? `<a href="mailto:${esc(site.email)}">Email</a>` : ''}
      </p>
    </div>
    <figure class="photo-card">
      <img src="${esc(hero.photo || '')}" alt="${esc(hero.photoAlt || site.name)}" width="1000" height="1250" fetchpriority="high">
      <span class="corner tl" aria-hidden="true"></span><span class="corner tr" aria-hidden="true"></span><span class="corner bl" aria-hidden="true"></span><span class="corner br" aria-hidden="true"></span>
      ${site.availability?.text ? `<figcaption class="status ${site.availability.open ? 'is-open' : 'is-closed'}"><span><small>${esc(hero.statusLabel || 'Status')}</small>${esc(site.availability.text)}</span><i aria-hidden="true"></i></figcaption>` : ''}
    </figure>
  </div>
</section>`;

  const work = site.work || {};
  const workSection = `<section class="section s-a" id="work" aria-labelledby="work-title">
  <div class="wrap">
    ${sectionHead('work', { eyebrow: work.eyebrow, heading: work.heading || 'Selected work', intro: work.intro })}
    <div class="filters" role="group" aria-label="Filter projects by type">
      <button type="button" class="filter is-active" data-filter="all" aria-pressed="true">All</button>
      ${filterButtons.map((c) => `<button type="button" class="filter" data-filter="${c}" aria-pressed="false">${esc(catLabel(c))}</button>`).join('\n      ')}
    </div>
    ${
      projects.length
        ? `<ul class="grid" id="project-grid">\n${projects.map(projectCard).join('\n')}\n</ul>`
        : '<p class="empty">No projects yet. Add a file to content/projects to show your first one here.</p>'
    }
  </div>
</section>`;

  const about = site.about || {};
  const aboutSection = `<section class="section s-b" id="about" aria-labelledby="about-title">
  <div class="wrap about">
    <div class="about-text">
      ${sectionHead('about', { eyebrow: about.eyebrow, heading: about.heading || 'About me' })}
      ${toList(about.paragraphs).map((p, i) => `<p class="${i === 0 ? 'lead' : 'soft'}">${esc(p)}</p>`).join('\n      ')}
      <ul class="tag-grid">
        ${toList(about.tags).map((t) => `<li>${icon(t.icon)}<span>${esc(t.label)}</span></li>`).join('\n        ')}
      </ul>
      ${site.cv ? `<p><a class="btn btn-dark" href="${esc(site.cv)}" download>Download my CV</a></p>` : ''}
    </div>
    <figure class="about-photo">
      <img src="${esc(about.photo || '')}" alt="${esc(about.photoAlt || site.name)}" width="900" height="1125" loading="lazy">
    </figure>
  </div>
</section>`;

  const services = site.services || {};
  const servicesSection = `<section class="section s-a" id="services" aria-labelledby="services-title">
  <div class="wrap">
    ${sectionHead('services', { eyebrow: services.eyebrow, heading: services.heading || 'What I do', intro: services.intro })}
    <ul class="services">
      ${toList(services.items)
        .map(
          (s) => `<li class="service">
        ${icon(CATEGORY_ICON[s.category])}
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description)}</p>
        <ul class="chips">${toList(s.tools).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </li>`
        )
        .join('\n      ')}
    </ul>
  </div>
</section>`;

  const skillsCfg = site.skills || {};
  const skillsSection = skills.length
    ? `<section class="section s-b" id="skills" aria-labelledby="skills-title">
  <div class="wrap">
    ${sectionHead('skills', { eyebrow: skillsCfg.eyebrow || 'Skills & tools', heading: skillsCfg.heading || 'Skills and tools', intro: skillsCfg.intro })}
    <div class="skills">
      ${skills
        .map(
          (g) => `<div class="skill-group">
        <h3>${icon(CATEGORY_ICON[g.category])}${esc(g.title)}</h3>
        <ul class="chips">${toList(g.items).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`
    : '';

  const process = site.process || {};
  const processSection = toList(process.steps).length
    ? `<section class="section s-dark" id="process" aria-labelledby="process-title">
  <div class="wrap">
    ${sectionHead('process', { eyebrow: process.eyebrow, heading: process.heading || 'How I work', intro: process.intro })}
    <ol class="steps">
      ${process.steps.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>`
    : '';

  const expCfg = site.experience || {};
  const experienceSection =
    exp.experience?.length || exp.certifications?.length || exp.education?.length
      ? `<section class="section s-a" id="experience" aria-labelledby="experience-title">
  <div class="wrap">
    ${sectionHead('experience', { eyebrow: expCfg.eyebrow, heading: expCfg.heading || 'Experience' })}
    <ul class="timeline">
      ${toList(exp.experience)
        .map(
          (e) => `<li>
        <p class="when">${esc(e.period)}</p>
        <div>
          <h3>${esc(e.role)}</h3>
          <p class="org">${esc(e.org)}</p>
          <ul class="points">${toList(e.points).map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul>
        </div>
      </li>`
        )
        .join('\n      ')}
    </ul>
    ${
      exp.education?.length
        ? `<h3 class="sub">${esc(expCfg.educationHeading || 'Education')}</h3>
    <ul class="certs">
      ${exp.education.map((e) => `<li><span><strong>${esc(e.title)}</strong>${e.note ? `<br><span class="muted">${esc(e.note)}</span>` : ''}</span><span class="muted">${esc([e.school, e.period].filter(Boolean).join(', '))}</span></li>`).join('\n      ')}
    </ul>`
        : ''
    }
    ${
      exp.certifications?.length
        ? `<h3 class="sub">${esc(expCfg.certificationsHeading || 'Certifications')}</h3>
    <ul class="certs">
      ${exp.certifications.map((c) => `<li><span>${esc(c.title)}</span><span class="muted">${esc([c.issuer, c.year].filter(Boolean).join(', '))}</span></li>`).join('\n      ')}
    </ul>`
        : ''
    }
  </div>
</section>`
      : '';

  const tCfg = site.testimonials || {};
  const testimonialsSection = testimonials.length
    ? `<section class="section s-b" id="testimonials" aria-labelledby="testimonials-title">
  <div class="wrap">
    ${sectionHead('testimonials', { eyebrow: tCfg.eyebrow, heading: tCfg.heading || 'Kind words' })}
    <ul class="quotes">
      ${testimonials
        .map(
          (t) => `<li><blockquote><p>${esc(t.quote)}</p></blockquote><p class="who"><strong>${esc(t.name)}</strong>${t.title ? `<span class="muted">${esc(t.title)}</span>` : ''}</p></li>`
        )
        .join('\n      ')}
    </ul>
  </div>
</section>`
    : '';

  const contact = site.contact || {};
  const contactSection = `<section class="section s-dark" id="contact" aria-labelledby="contact-title">
  <div class="wrap contact">
    <div>
      ${sectionHead('contact', { eyebrow: contact.eyebrow, heading: contact.heading || 'Get in touch', intro: contact.text })}
      <dl class="details">
        ${site.email ? `<div><dt>Email</dt><dd><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></dd></div>` : ''}
        ${site.phone ? `<div><dt>Phone</dt><dd><a href="tel:${esc(site.phone.replace(/\s/g, ''))}">${esc(site.phone)}</a></dd></div>` : ''}
        ${site.whatsapp ? `<div><dt>WhatsApp</dt><dd><a href="https://wa.me/${esc(site.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener">Message me</a></dd></div>` : ''}
        ${site.location ? `<div><dt>Based in</dt><dd>${esc(site.location)}</dd></div>` : ''}
        ${socials.map((s) => `<div><dt>${esc(s.label)}</dt><dd><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url.replace(/^https?:\/\/(www\.)?/, ''))}</a></dd></div>`).join('\n        ')}
      </dl>
    </div>
    <form class="form" name="contact" method="POST" action="/thanks/" data-netlify="true" netlify-honeypot="bot-field">
      <input type="hidden" name="form-name" value="contact">
      <p class="hp" aria-hidden="true"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <label>Your name <input type="text" name="name" required autocomplete="name"></label>
      <label>Your email <input type="email" name="email" required autocomplete="email"></label>
      <label>What do you need?
        <select name="service">
          <option value="Instructional design">Instructional design</option>
          <option value="Web design">Web design</option>
          <option value="Graphic design">Graphic design</option>
          <option value="Something else">Something else</option>
        </select>
      </label>
      <label>Tell me about your project <textarea name="message" rows="5" required></textarea></label>
      <button class="btn btn-primary" type="submit">Send message</button>
    </form>
  </div>
</section>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.role,
    email: site.email ? `mailto:${site.email}` : undefined,
    url: baseUrl || undefined,
    sameAs: socials.map((s) => s.url)
  };

  return `${head({ title: site.seo?.title || site.name, description: site.seo?.description || site.role, path: '/' })}
<body>
${header()}
<main id="main">
${heroSection}
${workSection}
${aboutSection}
${servicesSection}
${skillsSection}
${processSection}
${experienceSection}
${testimonialsSection}
${contactSection}
</main>
${footer()}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</body>
</html>`;
}

/* ---------- project pages ---------- */

function projectPage(p, index) {
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const facts = [
    ['Role', p.role],
    ['Client', p.client],
    ['Timeline', p.timeline],
    ['Date', p.date.getTime() ? formatDate(p.date) : ''],
    ['Tools', p.tools.join(', ')]
  ].filter(([, v]) => v);

  const embedBlock = p.embed
    ? `<div class="embed" style="aspect-ratio:${esc(p.embedRatio || '16 / 9')}">
      <iframe src="${esc(p.embed)}" title="${esc(p.embedTitle || p.title + ' demo')}" loading="lazy" allowfullscreen></iframe>
    </div>`
    : '';

  const galleryBlock = p.gallery.length
    ? `<section class="gallery-block" aria-label="Project images">
      <h2>Gallery</h2>
      <ul class="gallery ${p.category === 'graphic-design' ? 'gallery-masonry' : ''}">
        ${p.gallery
          .map(
            (g) => `<li><button type="button" class="shot" data-lightbox data-full="${esc(g.src)}" data-caption="${esc(g.caption || '')}" data-alt="${esc(g.alt || '')}"><img src="${esc(g.src)}" alt="${esc(g.alt || '')}" loading="lazy"></button>${g.caption ? `<p class="cap">${esc(g.caption)}</p>` : ''}</li>`
          )
          .join('\n        ')}
      </ul>
    </section>`
    : '';

  const description = p.summary || `${p.title}, a ${catLabel(p.category).toLowerCase()} project by ${site.name}.`;

  return `${head({
    title: `${p.title} | ${site.name}`,
    description,
    path: `/work/${p.slug}/`,
    image: p.thumbnail && !p.thumbnail.endsWith('.svg') ? p.thumbnail : ''
  })}
<body class="page-inner">
${header()}
<main id="main" class="project">
  <div class="wrap">
    <p class="crumb"><a href="/#work">All work</a></p>
    <header class="project-head">
      <p class="card-meta">${tag(p.category)}${p.placeholder ? '<span class="ph">Placeholder images</span>' : ''}</p>
      <h1>${esc(p.title)}</h1>
      ${p.summary ? `<p class="lede">${esc(p.summary)}</p>` : ''}
      ${
        facts.length
          ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`
          : ''
      }
      ${
        p.links.length
          ? `<p class="project-links">${p.links.map((l) => `<a class="btn btn-dark" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</p>`
          : ''
      }
    </header>
    ${p.placeholder ? '<p class="notice">This project still uses placeholder images. Add your own images, then delete <code>placeholder: true</code> from the top of this project file.</p>' : ''}
    ${p.thumbnail ? `<figure class="project-hero"><img src="${esc(p.thumbnail)}" alt="${esc(p.thumbnailAlt || p.title)}" width="1600" height="1000"></figure>` : ''}
    ${embedBlock}
    <div class="prose">
${p.html}
    </div>
    ${galleryBlock}
    <nav class="pager" aria-label="More projects">
      <a href="/work/${prev.slug}/"><span class="muted">Previous project</span><strong>${esc(prev.title)}</strong></a>
      <a href="/work/${next.slug}/"><span class="muted">Next project</span><strong>${esc(next.title)}</strong></a>
    </nav>
  </div>
</main>
${footer()}
</body>
</html>`;
}

function simplePage({ title, heading, text, path: pagePath, noindex = true }) {
  return `${head({ title: `${title} | ${site.name}`, description: text, path: pagePath, noindex })}
<body class="page-inner">
${header()}
<main id="main">
  <div class="wrap simple">
    <h1>${esc(heading)}</h1>
    <p class="intro">${esc(text)}</p>
    <p><a class="btn btn-dark" href="/">Back to the home page</a></p>
  </div>
</main>
${footer()}
</body>
</html>`;
}

/* ---------- write everything ---------- */

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function write(rel, contents) {
  const full = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(ROOT, 'static'), DIST);

write('index.html', homePage());
projects.forEach((p, i) => write(`work/${p.slug}/index.html`, projectPage(p, i)));
write(
  'thanks/index.html',
  simplePage({
    title: 'Message sent',
    heading: 'Thank you, your message is sent.',
    text: 'I will reply within two working days.',
    path: '/thanks/'
  })
);
write(
  '404.html',
  simplePage({
    title: 'Page not found',
    heading: 'That page does not exist.',
    text: 'The link may be old or mistyped. The home page has all my work.',
    path: '/404.html'
  })
);

if (baseUrl) {
  const urls = ['/', ...projects.map((p) => `/work/${p.slug}/`)];
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${baseUrl}${u}</loc></url>`).join('\n')}\n</urlset>\n`
  );
}
write('robots.txt', `User-agent: *\nAllow: /\n${baseUrl ? `Sitemap: ${baseUrl}/sitemap.xml\n` : ''}`);

console.log(`Built ${projects.length} project page${projects.length === 1 ? '' : 's'} into dist/`);
