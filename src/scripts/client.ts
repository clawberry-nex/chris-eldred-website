// Mobile nav toggle
const navToggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
const nav = document.getElementById('nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
}

// Scroll-spy
if (nav) {
  const navLinks = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a'));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href') ?? ''))
    .filter((el): el is Element => Boolean(el));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = '#' + en.target.id;
          navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === id));
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px' }
  );
  sections.forEach((s) => io.observe(s));
}

// Video lightbox
const lightbox = document.getElementById('lightbox');
const lbInner = lightbox?.querySelector<HTMLDivElement>('.lb-inner');
const lbClose = lightbox?.querySelector<HTMLButtonElement>('.lb-close');

function openLightbox(youtubeId: string) {
  if (!lightbox || !lbInner) return;
  lbInner.innerHTML = `<iframe
    src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0&modestbranding=1&autoplay=1"
    title="YouTube video"
    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>`;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox || !lbInner) return;
  lightbox.classList.remove('open');
  lbInner.innerHTML = '';
  document.body.style.overflow = '';
}

if (lightbox) {
  document.querySelectorAll<HTMLButtonElement>('.video-frame[data-youtube]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.youtube;
      if (id) openLightbox(id);
    });
  });

  lbClose?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });
}

// Contact form
const form = document.getElementById('bookingForm') as HTMLFormElement | null;
const status = document.getElementById('formStatus');
const submitBtn = form?.querySelector<HTMLButtonElement>('button[type="submit"]');

function showStatus(msg: string, isError = false) {
  if (!status) return;
  status.textContent = msg;
  status.classList.toggle('error', isError);
  status.classList.add('show');
  if (!isError) {
    window.setTimeout(() => status.classList.remove('show'), 6000);
  }
}

if (form && submitBtn) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let ok = true;
    const fields = form.querySelectorAll<HTMLDivElement>('.field');
    fields.forEach((f) => {
      const inp = f.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      if (!inp) return;
      let valid = true;
      if (inp.hasAttribute('required') && !inp.value.trim()) valid = false;
      if ((inp as HTMLInputElement).type === 'email' && inp.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value)) {
        valid = false;
      }
      f.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) return;

    submitBtn.disabled = true;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      date: String(data.get('date') ?? ''),
      message: String(data.get('message') ?? ''),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Something went wrong sending the enquiry.');
      }
      showStatus('Thanks — Chris will be in touch shortly.');
      form.reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong sending the enquiry.';
      showStatus(msg, true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((inp) => {
    inp.addEventListener('input', () => inp.closest('.field')?.classList.remove('invalid'));
  });
}
