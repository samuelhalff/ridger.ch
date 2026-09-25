"use client";

import type React from "react";
import { Fragment, useId, useState } from "react";

type NavKey = "overview" | "positions" | "realEstate" | "documents" | "reporting";

type Activity = { label: string; amount: string; date: string; positive: boolean };
type AllocSeg = { label: string; pct: string };
type PosRow = { name: string; qty: string; value: string; delta: string; positive: boolean };
type PosGroup = { custodian: string; subtotal: string; rows: PosRow[] };
type Property = { address: string; value: string; note: string; ltv: number };
type DocItem = { name: string; meta: string; date: string };
type Report = { name: string; date: string };
type Fee = { label: string; value: string };

export type PlatformStrings = {
  frame: { browserLabel: string };
  sidebar: {
    wordmark: string;
    nav: Record<NavKey, string>;
    userName: string;
    userInitials: string;
    userRole: string;
    mobileNavLabel: string;
  };
  overview: {
    netWorthLabel: string;
    netWorthValue: string;
    netWorthDelta: string;
    periods: string[];
    chartTitle: string;
    chartAria: string;
    allocationTitle: string;
    allocationAria: string;
    allocation: AllocSeg[];
    activityTitle: string;
    activity: Activity[];
  };
  positions: {
    columns: { position: string; quantity: string; value: string; delta: string };
    trendAria: string;
    groups: PosGroup[];
  };
  realEstate: {
    estimatedLabel: string;
    yieldLabel: string;
    ltvLabel: string;
    ltvAria: string;
    cards: Property[];
  };
  documents: {
    lockAria: string;
    footnote: string;
    items: DocItem[];
  };
  reporting: {
    reportsTitle: string;
    downloadLabel: string;
    reports: Report[];
    feesTitle: string;
    fees: Fee[];
    feesTotal: string;
  };
};

const NAV_ORDER: NavKey[] = ["overview", "positions", "realEstate", "documents", "reporting"];

// palette (hex, kept literal per design tokens)
const PINE = "#1e3a32";
const BRONZE = "#9a7b4f";
const NEG = "#8c3b2e";
const ALLOC_COLORS = [PINE, BRONZE, "#a39d90", "#c9c2b4"];

const num = "font-mono tabular-nums";

function LockGlyph({ label }: { label: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <rect x="2.5" y="5.5" width="7" height="5" rx="0.6" stroke={PINE} strokeWidth="1" />
      <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" stroke={PINE} strokeWidth="1" fill="none" />
    </svg>
  );
}

/* 12-month net-worth line, single 1.5px pine stroke, hairline baseline, dot on last point */
function NetWorthChart({ title, aria }: { title: string; aria: string }) {
  const pts = [42, 44, 43, 46, 48, 47, 50, 53, 55, 58, 60, 63];
  const w = 320;
  const h = 96;
  const pad = 6;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const stepX = (w - pad * 2) / (pts.length - 1);
  const y = (v: number) => pad + (h - pad * 2) * (1 - (v - min) / (max - min));
  const coords = pts.map((v, i) => [pad + i * stepX, y(v)] as const);
  const d = coords.map(([x, yy], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${yy.toFixed(1)}`).join(" ");
  const [lx, ly] = coords[coords.length - 1];
  const yLabels = ["32M", "28M", "24M"];
  return (
    <figure className="m-0">
      <figcaption className="rule-label mb-3">{title}</figcaption>
      <div className="flex items-stretch gap-3">
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={aria} className="min-w-0 flex-1">
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#d9d2c5" strokeWidth="1" />
          <path d={d} fill="none" stroke={PINE} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={lx} cy={ly} r="2.5" fill={PINE} />
        </svg>
        <div className={`flex flex-col justify-between py-1 text-[10px] text-[#6e6a62] ${num}`}>
          {yLabels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </figure>
  );
}

function Allocation({ title, aria, segs }: { title: string; aria: string; segs: AllocSeg[] }) {
  return (
    <figure className="m-0">
      <figcaption className="rule-label mb-3">{title}</figcaption>
      <div
        className="flex h-3 w-full overflow-hidden rounded-[2px]"
        role="img"
        aria-label={aria}
      >
        {segs.map((s, i) => (
          <span
            key={s.label}
            style={{ width: s.pct, backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {segs.map((s, i) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm text-[#1a1a18]">
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-[1px]"
                style={{ backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
                aria-hidden
              />
              {s.label}
            </span>
            <span className={`${num} text-[#6e6a62]`}>{s.pct}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <div className="flex items-center gap-4 border-t border-[#d9d2c5] py-3" aria-hidden>
      {Array.from({ length: cols }).map((_, i) => (
        <span
          key={i}
          className="platform-shimmer h-3 rounded"
          style={{ width: i === 0 ? "40%" : "16%" }}
        />
      ))}
    </div>
  );
}

function Sparkline({ up, aria }: { up: boolean; aria: string }) {
  const pts = up ? [8, 6, 7, 5, 4, 3, 2] : [3, 4, 3, 5, 6, 5, 7];
  const w = 40;
  const h = 20;
  const stepX = w / (pts.length - 1);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const y = (v: number) => 2 + (h - 4) * ((v - min) / (max - min));
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width="40" height="20" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={aria}>
      <path d={d} fill="none" stroke={up ? PINE : NEG} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LtvBar({ ltv, label, aria }: { ltv: number; label: string; aria: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="rule-label border-t-0 p-0">{label}</span>
        <span className={`text-[11px] text-[#6e6a62] ${num}`}>{ltv}%</span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-[1px] bg-[#e6e0d6]" role="img" aria-label={`${aria} ${ltv}%`}>
        <span style={{ width: `${ltv}%`, backgroundColor: PINE }} />
      </div>
    </div>
  );
}

/* ---- Panes ---- */

function OverviewPane({ s }: { s: PlatformStrings["overview"] }) {
  const [period, setPeriod] = useState("YTD");
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="rule-label text-[#9a7b4f]">{s.netWorthLabel}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="num-display text-3xl text-[#1a1a18] sm:text-4xl">{s.netWorthValue}</span>
            <span className="inline-flex items-center rounded-full border border-[#d9d2c5] px-2 py-0.5 text-xs text-[#1e3a32]">
              {s.netWorthDelta}
            </span>
          </div>
        </div>
        <div className={`flex items-center gap-4 text-xs ${num}`} role="tablist" aria-label={s.chartTitle}>
          {s.periods.map((p) => {
            const active = p === period;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                aria-pressed={active}
                className={`pb-0.5 transition-colors ${
                  active
                    ? "border-b border-[#1e3a32] text-[#1e3a32]"
                    : "border-b border-transparent text-[#6e6a62] hover:text-[#1a1a18]"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <NetWorthChart title={s.chartTitle} aria={s.chartAria} />
        <Allocation title={s.allocationTitle} aria={s.allocationAria} segs={s.allocation} />
      </div>

      <div>
        <p className="rule-label mb-1 text-[#9a7b4f]">{s.activityTitle}</p>
        <ul className="m-0 list-none p-0">
          {s.activity.map((a) => (
            <li
              key={a.label}
              className="flex items-center justify-between gap-4 border-t border-[#d9d2c5] py-3 text-sm"
            >
              <span className="text-[#1a1a18]">{a.label}</span>
              <span className="flex items-center gap-4">
                <span className={`${num}`} style={{ color: a.positive ? PINE : NEG }}>
                  {a.amount}
                </span>
                <span className={`w-[80px] text-right text-[#6e6a62] ${num}`}>{a.date}</span>
              </span>
            </li>
          ))}
          {[0, 1].map((i) => (
            <li key={`sk-${i}`} className="flex items-center justify-between gap-4 border-t border-[#d9d2c5] py-3" aria-hidden>
              <span className="platform-shimmer h-3 w-[45%] rounded" />
              <span className="platform-shimmer h-3 w-[20%] rounded" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PositionsPane({ s }: { s: PlatformStrings["positions"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left">
            <th className="rule-label border-t-0 p-0 pb-2 font-medium">{s.columns.position}</th>
            <th className="rule-label border-t-0 p-0 pb-2 text-right font-medium">{s.columns.quantity}</th>
            <th className="rule-label border-t-0 p-0 pb-2 text-right font-medium">{s.columns.value}</th>
            <th className="rule-label border-t-0 p-0 pb-2 text-right font-medium">{s.columns.delta}</th>
          </tr>
        </thead>
        <tbody>
          {s.groups.map((g) => (
            <Fragment key={g.custodian}>
              <tr className="border-t border-[#d9d2c5]">
                <th scope="rowgroup" className="py-2 text-left font-medium text-[#1a1a18]">
                  {g.custodian}
                </th>
                <td />
                <td className={`py-2 text-right text-[#1a1a18] ${num}`} colSpan={2}>
                  {g.subtotal}
                </td>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.name} className="border-t border-[#d9d2c5]/60">
                  <td className="py-2.5 pr-3 text-[#1a1a18]">
                    <span className="flex items-center gap-3">
                      <Sparkline up={r.positive} aria={s.trendAria} />
                      {r.name}
                    </span>
                  </td>
                  <td className={`py-2.5 text-right text-[#6e6a62] ${num}`}>{r.qty}</td>
                  <td className={`py-2.5 text-right text-[#1a1a18] ${num}`}>{r.value}</td>
                  <td className={`py-2.5 text-right ${num}`} style={{ color: r.positive ? PINE : NEG }}>
                    {r.delta}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
          {[0, 1, 2].map((i) => (
            <tr key={`sk-${i}`} className="border-t border-[#d9d2c5]/60" aria-hidden>
              <td className="py-2.5"><span className="platform-shimmer block h-3 w-[55%] rounded" /></td>
              <td className="py-2.5"><span className="platform-shimmer ml-auto block h-3 w-[50%] rounded" /></td>
              <td className="py-2.5"><span className="platform-shimmer ml-auto block h-3 w-[60%] rounded" /></td>
              <td className="py-2.5"><span className="platform-shimmer ml-auto block h-3 w-[40%] rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RealEstatePane({ s }: { s: PlatformStrings["realEstate"] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {s.cards.map((c) => (
        <article key={c.address} className="border border-[#d9d2c5] p-4">
          <h3 className="font-display text-lg text-[#1a1a18]">{c.address}</h3>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="rule-label border-t-0 p-0 text-[#9a7b4f]">{s.estimatedLabel}</span>
            <span className={`text-sm text-[#1a1a18] ${num}`}>{c.value}</span>
          </div>
          <p className="mt-1 text-sm text-[#6e6a62]">{c.note}</p>
          <div className="mt-4">
            <LtvBar ltv={c.ltv} label={s.ltvLabel} aria={s.ltvAria} />
          </div>
        </article>
      ))}
      {/* fully skeleton card */}
      <article className="border border-[#d9d2c5] p-4" aria-hidden>
        <span className="platform-shimmer block h-5 w-[70%] rounded" />
        <div className="mt-3 flex items-center justify-between">
          <span className="platform-shimmer h-3 w-[30%] rounded" />
          <span className="platform-shimmer h-3 w-[25%] rounded" />
        </div>
        <span className="platform-shimmer mt-3 block h-3 w-[40%] rounded" />
        <span className="platform-shimmer mt-5 block h-1.5 w-full rounded" />
      </article>
    </div>
  );
}

function DocumentsPane({ s }: { s: PlatformStrings["documents"] }) {
  return (
    <div>
      <ul className="m-0 list-none p-0">
        {s.items.map((d) => (
          <li key={d.name} className="flex items-center gap-4 border-t border-[#d9d2c5] py-3 text-sm">
            <LockGlyph label={s.lockAria} />
            <span className={`w-[92px] shrink-0 text-[#6e6a62] ${num}`}>{d.date}</span>
            <span className="min-w-0 flex-1 truncate text-[#1a1a18]">{d.name}</span>
            <span className={`shrink-0 text-[#6e6a62] ${num}`}>{d.meta}</span>
          </li>
        ))}
        {[0, 1, 2].map((i) => (
          <li key={`sk-${i}`} className="flex items-center gap-4 border-t border-[#d9d2c5] py-3" aria-hidden>
            <span className="platform-shimmer size-3 rounded" />
            <span className="platform-shimmer h-3 w-[70%] rounded" />
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-2 text-xs text-[#6e6a62]">
        <LockGlyph label={s.lockAria} />
        {s.footnote}
      </p>
    </div>
  );
}

function ReportingPane({ s }: { s: PlatformStrings["reporting"] }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="rule-label mb-1 text-[#9a7b4f]">{s.reportsTitle}</p>
        <ul className="m-0 list-none p-0">
          {s.reports.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-4 border-t border-[#d9d2c5] py-3 text-sm">
              <span className="flex items-center gap-4">
                <span className={`w-[92px] shrink-0 text-[#6e6a62] ${num}`}>{r.date}</span>
                <span className="text-[#1a1a18]">{r.name}</span>
              </span>
              <button
                type="button"
                className="text-[#1e3a32] underline decoration-[#1e3a32]/40 underline-offset-4 transition-colors hover:decoration-[#1e3a32]"
              >
                {s.downloadLabel}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="rule-label mb-1 text-[#9a7b4f]">{s.feesTitle}</p>
        <ul className="m-0 list-none p-0">
          {s.fees.map((f) => (
            <li key={f.label} className="flex items-center justify-between gap-4 border-t border-[#d9d2c5] py-3 text-sm">
              <span className="text-[#1a1a18]">{f.label}</span>
              <span className={`${num} text-[#1a1a18]`}>{f.value}</span>
            </li>
          ))}
          <li className="border-t border-[#1a1a18]/25 py-4">
            <span className="font-display text-base text-[#1a1a18]">{s.feesTotal}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function DashboardMockup({ strings }: { strings: PlatformStrings }) {
  const [active, setActive] = useState<NavKey>("overview");
  const panelId = useId();

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      {/* browser chrome frame */}
      <div className="overflow-hidden rounded-xl border border-[#d9d2c5] bg-[#faf7f2]">
        <div
          className="flex items-center gap-2 border-b border-[#d9d2c5] bg-[#f1ece3] px-4 py-2.5"
          aria-label={strings.frame.browserLabel}
        >
          <span className="size-2.5 rounded-full bg-[#d9d2c5]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[#d9d2c5]" aria-hidden />
          <span className="size-2.5 rounded-full bg-[#d9d2c5]" aria-hidden />
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Sidebar (desktop) */}
          <aside className="hidden shrink-0 flex-col justify-between border-r border-[#d9d2c5] p-5 md:flex md:w-[196px]">
            <div>
              <p className="font-mono text-sm font-semibold tracking-[0.18em] text-[#1a1a18]">
                {strings.sidebar.wordmark}
              </p>
              <nav className="mt-6" aria-label={strings.sidebar.mobileNavLabel}>
                <ul className="m-0 list-none space-y-1 p-0">
                  {NAV_ORDER.map((key) => {
                    const isActive = key === active;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => setActive(key)}
                          aria-current={isActive ? "page" : undefined}
                          className={`w-full border-l-2 py-1.5 pl-3 text-left font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                            isActive
                              ? "border-[#9a7b4f] text-[#1e3a32]"
                              : "border-transparent text-[#6e6a62] hover:text-[#1a1a18]"
                          }`}
                        >
                          {strings.sidebar.nav[key]}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
            <div className="mt-8 flex items-center gap-3 border-t border-[#d9d2c5] pt-4">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1e3a32] text-[11px] font-medium text-[#faf7f2]"
                aria-hidden
              >
                {strings.sidebar.userInitials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-[#1a1a18]">{strings.sidebar.userName}</span>
                <span className="block truncate text-[11px] text-[#6e6a62]">{strings.sidebar.userRole}</span>
              </span>
            </div>
          </aside>

          {/* Mobile top tab row */}
          <nav
            className="border-b border-[#d9d2c5] md:hidden"
            aria-label={strings.sidebar.mobileNavLabel}
          >
            <ul className="m-0 flex list-none gap-1 overflow-x-auto p-3">
              {NAV_ORDER.map((key) => {
                const isActive = key === active;
                return (
                  <li key={key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActive(key)}
                      aria-current={isActive ? "page" : undefined}
                      className={`whitespace-nowrap border-b-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                        isActive ? "border-[#9a7b4f] text-[#1e3a32]" : "border-transparent text-[#6e6a62]"
                      }`}
                    >
                      {strings.sidebar.nav[key]}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Main pane */}
          {/* All panes share one grid cell, so the frame always takes the
              tallest pane's height and never jumps when switching tabs.
              Inactive panes keep their layout but are hidden and inert. */}
          <div id={panelId} role="region" aria-live="polite" className="grid min-w-0 flex-1 p-5 sm:p-7">
            {(
              [
                ["overview", <OverviewPane key="overview" s={strings.overview} />],
                ["positions", <PositionsPane key="positions" s={strings.positions} />],
                ["realEstate", <RealEstatePane key="realEstate" s={strings.realEstate} />],
                ["documents", <DocumentsPane key="documents" s={strings.documents} />],
                ["reporting", <ReportingPane key="reporting" s={strings.reporting} />],
              ] as [NavKey, React.ReactNode][]
            ).map(([key, pane]) => (
              <div
                key={key}
                className={`col-start-1 row-start-1 min-w-0 ${active === key ? "" : "invisible"}`}
                aria-hidden={active !== key}
                inert={active !== key}
              >
                {pane}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* shimmer keyframes, scoped */}
      <style>{`
        .platform-shimmer {
          background: linear-gradient(90deg, #f1ece3 25%, #e6e0d6 37%, #f1ece3 63%);
          background-size: 400% 100%;
          animation: platform-shimmer 1.4s ease infinite;
        }
        @keyframes platform-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .platform-shimmer { animation: none; }
        }
      `}</style>
    </div>
  );
}
