# Samal Journeys Implementation Plan

> For agentic workers: use superpowers:subagent-driven-development or superpowers:executing-plans task by task.

**Goal:** Consistently rebrand the complete verified demo and document/model package as Samal Journeys.
**Architecture:** Reuse the current managed worktree, native frontend, Node API, canonical financial JSON and existing document/workbook generators. Parallel work owns disjoint files; root integrates and verifies.
**Tech Stack:** Node 24.16.0, HTML/CSS/JavaScript, Python ReportLab/python-docx, bundled artifact-tool.
**Spec:** ../specs/2026-10-23-samal-brand-design.md

## Global constraints
Exact name Samal Journeys. Preserve Saryarqa Routes facts, numeric financial assumptions, report page budget and AI/team disclosures. Real photographs with no effects. Preserve existing store/cookie keys for compatibility. No services or deployment.

## Review focus
Longer brand must fit the 360px header. Workbook formulas and both scenarios must match the unchanged canonical model. Report must contain current evidence, not unsupported production claims. PDF/DOCX pagination must be checked or limitations named. Historical references may retain old names; no stale old product name in final user-facing outputs.

## Tasks
- [x] Root: update public HTML/JS branding, responsive wordmark, package display/log messages and current documentation. Run existing tests/check/build; inspect new brand at 360/768/1440 and capture new screenshots under assets/screenshots/samal.
- [x] Finance agent: own finance/*. Rename workbook and visible labels, refine warm report-compatible styling without changing formulas/inputs. Rebuild with bundled artifact-tool, compare scenarios, inspect exported XLSX and rendered sheets. Report unchanged numeric fingerprints.
- [x] Report agent: own scripts/build_report.py, docs/report.md, deliverables/* and generated report flow asset. Update current implementation/evidence and warm typography/colors; consume root-provided Samal screenshots and unchanged finance/summary.json. Rebuild PDF and DOCX; inspect all PDF pages, attempt DOCX renderer and clearly record any unavailable renderer.
- [x] Root integration: update README/source/tool/verification records and cross-file paths. Review final generated artifacts and brand occurrences; preserve substantive human review gates.
- [x] Independent reviewer: read-only source/artifact audit for current brand, old references, numeric consistency and unsupported claims. Root resolves material findings.
- [x] Root delivery: coherent commit(s), authorized push, remote SHA comparison, clean worktree and direct PDF/Word/Excel links plus running demo.

Verification uses existing behavioral tests for unchanged logic, direct browser layout checks and artifact source/formula/layout checks. No brittle tests of mere text substitutions.

Evidence: docs/samal-verification.md, deliverables/report_verification.json and finance/brand_verification.json. Independent review found no material issue. Delivery SHA is reported in the handover after remote verification.
