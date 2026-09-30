# Subcontractor Flow-Down Kit

A free tool for defense primes: track which subcontractors handle CUI, determine what each one owes you, and generate flow-down notices.

**Live tool:** https://nehemiah313.github.io/flowdown-kit/

## What it does

- **Subcontractor register**: name, CAGE, contact, subcontract number, CUI status, SPRS score, assessment date, IR point of contact
- **Automatic flow-down determination**: subs handling CUI get the full requirement list (implement NIST 800-171, current SPRS assessment, 24-hour incident notice to the prime, forensic preservation, flow down further); others are marked clear or undetermined
- **Flow-down notice generator**: per-sub plain-English notice letter with your prime contract details, what the sub must do, and what they must send back. Preview in the browser, download as Markdown. Downloading marks the notice sent.
- **Dashboard**: subs tracked, CUI subs, notices sent, acknowledgments received, CUI subs missing SPRS scores
- **Export**: subcontractor register as CSV
- Everything stays in your browser (localStorage only, nothing uploaded)

## Honest framing

The notice is a planning summary. The subcontract terms, including the flowed-down DFARS clauses, control in all cases. Review with counsel before sending. Guidance only, not legal advice.

## Built by

**Neo Harvard**, CEO of [AI Tech Pros](https://aitechpros.ai) — SPRS and CMMC readiness for defense contractors. Part of the [MAPS framework](https://github.com/nehemiah313/maps-framework) family: Map, Assess, Prioritize, Sustain.
