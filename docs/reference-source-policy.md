# Reference source policy

Public article sources must not boost competitors. The AI update process may use competitor pages as private research inspiration, but published `source_url`, `references[].url`, and article body links must use the curated allowlist below.

The canonical allowlist lives in `scripts/lib/referenceValidator.js` as `ALLOWED_REFERENCE_DOMAINS`. CI enforces it with:

```bash
npm run validate:reference-sources
```

## Allowed source categories

- Swiss federal sources: `admin.ch` and all subdomains.
- Swiss public portal: `ch.ch`.
- Swiss cantons: `ag.ch`, `ai.ch`, `ar.ch`, `be.ch`, `bl.ch`, `bs.ch`, `fr.ch`, `ge.ch`, `gl.ch`, `gr.ch`, `ju.ch`, `lu.ch`, `ne.ch`, `nw.ch`, `ow.ch`, `sg.ch`, `sh.ch`, `so.ch`, `sz.ch`, `tg.ch`, `ti.ch`, `ur.ch`, `vd.ch`, `vs.ch`, `zg.ch`, `zh.ch`.
- Official or institutional Swiss bodies: `ahv-iv.ch`, `caisseavs.ch`, `entscheidsuche.ch`, `finma.ch`, `snb.ch`, `so-fit.ch`, `swissdec.ch`, `zefix.ch`.
- Social insurance and compensation funds: `aknw.ch`, `akso.ch`, `cdas.ch`, `sva-bl.ch`, `sva-sz.ch`, `svash.ch`.
- Professional and industry associations: `amsuisse.ch`, `ccig.ch`, `economiesuisse.ch`, `fer.ch`, `swissaccounting.org`, `veb.ch`.
- International and reference sources: `europa.eu`, `francophonie.org`, `oecd.org`, `wikipedia.org`.
- Recognized software/vendor documentation: `github.com`, `odoo.com`.
- Academic, educational, or approved partner sources: `controledegestion.org`, `he-arc.ch`, `houle.ai`.
- Self-reference when relevant: `ark-fid.ch`.

## Excluded sources

Do not publish links to fiduciaries, accounting firms, Treuhand firms, law firms, notaries, consulting firms, Odoo integrators, Big 4 firms, or other competitors.

The built-in blocklist currently includes known previously generated firm sources: `cobalt-it.ch`, `ficops.ch`, `fidflow.ch`, `gaapex.ch`, `hoop.swiss`, `niris.ch`, `open-net.ch`.

`REFERENCE_ALLOWED_DOMAINS` can add recognized domains at runtime, but the built-in firm blocklist still wins. Use `REFERENCE_BLOCKED_DOMAINS` for emergency removals.
