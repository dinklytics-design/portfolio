# Audit JSON schema

Produced by `workers/audit/audit_site.py`, consumed by `packages/scoring/scoring.py`.
Every field the scorer uses is evidence the auditor actually observed — the
scorer never fills gaps with guesses (missing PSI → renormalised weights +
reduced confidence, see scoring.py).

```jsonc
{
  "url":        "https://…",            // as requested
  "final_url":  "https://…",            // after redirects
  "fetched_at": "ISO-8601 UTC",
  "fetch_ok":   true,                   // homepage returned <400 with a body

  "https": {
    "used":              true,          // final URL is https
    "enforced_redirect": true,          // http:// variant redirects to https (null = untested)
    "cert_valid":        true,          // false when TLS verification failed
    "cert_error":        null,
    "mixed_content":     false          // http:// sub-resources on the https homepage
  },

  "cms": { "name": "wordpress|wix|squarespace|weebly|godaddy|shopify|custom|unknown",
           "version": "6.7" | null,     // only when the site itself states it (WP generator)
           "evidence": ["…"] },

  "pages_crawled": 12,                  // ≤ 25, same host only
  "pages": [{ "url": "…", "status": 200, "error": null }],

  // Homepage markup signals + SITE-WIDE conversion aggregates.
  // (Conversion items are aggregated across crawled pages: a contact form on
  // /contact counts. Everything else here is the homepage itself.)
  "homepage": {
    "has_viewport_meta":    true,
    "uses_table_layout":    false,      // nested tables or table layout attrs
    "has_flash":            false,
    "legacy_tags":          ["font"],   // font/center/marquee/frameset/…
    "fixed_width_px":       760 | null, // most common fixed px width, 500–1200 band
    "copyright_year":       2019 | null,// latest year following a © / "copyright"
    "last_modified":        "2019-03-04" | null,  // homepage Last-Modified header
    "newest_content_date":  "2024-05-11" | null,  // newest plausible date in page text (heuristic)
    "has_click_to_call":    true,       // any tel: link
    "has_contact_form":     true,       // form w/ textarea, email input, or contact markers
    "has_booking":          false,      // CTA-level: booking platform link OR booking-CTA targets ("schedule a consultation" counts here, NOT in complexity)
    "has_email_visible":    true,       // any public email found on the site
    "has_hours":            false,      // weekday + am/pm pattern in text
    "has_map":              false,      // Google Maps embed or link
    "has_reviews_link":     false       // Yelp/TripAdvisor/Google-review link
  },

  "contacts": {
    "emails": [{ "email": "…", "source_url": "page where first seen" }],
    "phones": [{ "phone": "407-555-0100", "source_url": "…" }]
  },

  "commerce":   { "has_cart": false, "has_shop": false, "product_count_hint": 0 },
  "complexity": { "has_member_area": false, "has_portal": false,
                  "has_booking_engine": false,        // true ONLY with evidence (tuning fix 2, 2026-10-21)
                  "booking_engine_evidence": [] },    // e.g. "booking platform link: calendly.com (…)", "same-host reservation flow with form: /book (…)" — scorer charges the booking adder off THIS list

  "content_portability": { "text_extractable_ratio": 0.9,  // share of fetched pages with >200 chars of text
                           "pages_with_text": 10 },

  "is_franchise": false,                // set by discovery (PLAN §1A), never by the auditor

  "psi": { "status": "ok|error|skipped",
           "error": null,               // verbatim refusal when keyless PSI declines
           "mobile_performance": 0.42 | null,   // 0..1 Lighthouse category scores
           "accessibility": 0.81 | null,
           "seo": 0.75 | null,
           "tap_targets_ok": true | null },

  "errors": []
}
```
