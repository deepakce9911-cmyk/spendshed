# Spendshed

Marketing site and free-audit funnel for Spendshed: finds every software subscription a company pays for, the seats nobody uses and the renewals coming up, then cancels and renegotiates on the company's behalf.

Static site, no build step. Open `index.html` or serve the folder:

```bash
node ../tools/serve.js . 4176
```

- `index.html` — the page (hero, report panel, features, how it works, estimate, pricing, FAQ, audit form)
- `css/site.css` — design system (Geist, black on white, one accent card)
- `js/site.js` — motion (CSS entrance for the hero, GSAP ScrollTrigger for the rest), estimate slider, audit form
- `assets/` — favicon and Open Graph image

## Audit form

The form posts to FormSubmit (`formsubmit.co/deepakce9911@gmail.com`) with file attachments. The first submission sends a one-time activation email to that inbox; click it once and the form is live. Swap the `action` for your own endpoint when the backend exists.

## Switches

- `?static=1` — no animations (for screenshots)
- `?sent=1` — shows the "sent" state of the form
