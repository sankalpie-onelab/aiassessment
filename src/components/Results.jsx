import { useState } from "react";
import { getSummaryStats } from "../utils/reconcile";
import { downloadReport } from "./ReportDownload";

const CATEGORY_META = {
  matches: {
    icon: "✅",
    label: "Normal Matches",
    desc: "Same ID, same amount, same settlement month",
    color: "#276749",
    bg: "#f0fff4",
    border: "#48bb78",
  },
  nextMonthSettlement: {
    icon: "📅",
    label: "Next Month Settlement",
    desc: "Same ID & amount but settled in a different month — not an error",
    color: "#0987a0",
    bg: "#e6fffa",
    border: "#38b2ac",
  },
  missingInBank: {
    icon: "❌",
    label: "Missing in Bank",
    desc: "In platform but no matching bank entry found",
    color: "#c05621",
    bg: "#fffaf0",
    border: "#f6ad55",
  },
  mismatches: {
    icon: "💸",
    label: "Amount Mismatch",
    desc: "Same transaction ID but amounts differ significantly",
    color: "#c53030",
    bg: "#fff5f5",
    border: "#fc8181",
  },
  roundingIssues: {
    icon: "💰",
    label: "Rounding Issues",
    desc: "Tiny amount difference (≤ 0.01) — likely floating-point rounding",
    color: "#b7791f",
    bg: "#fffff0",
    border: "#f6e05e",
  },
  duplicates: {
    icon: "🔁",
    label: "Duplicate Entries",
    desc: "Same transaction ID appears more than once in bank",
    color: "#2b6cb0",
    bg: "#ebf8ff",
    border: "#63b3ed",
  },
  missingInPlatform: {
    icon: "🔄",
    label: "Missing in Platform",
    desc: "Exists in bank but has no corresponding platform transaction",
    color: "#553c9a",
    bg: "#faf5ff",
    border: "#9f7aea",
  },
  refunds: {
    icon: "💳",
    label: "Refunds / Anomalies",
    desc: "Negative bank entry with no matching platform transaction",
    color: "#6b46c1",
    bg: "#fdf4ff",
    border: "#b794f4",
  },
};

export default function Results({ results, onReset }) {
  const stats = getSummaryStats(results);
  const [openSections, setOpenSections] = useState(
    () => new Set(stats.filter((s) => s.count > 0).map((s) => s.key))
  );
  const [focusedKey, setFocusedKey] = useState(null);

  const toggleSection = (key) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const scrollToSection = (key) => {
    setFocusedKey(key);
    if (!openSections.has(key)) {
      setOpenSections((prev) => new Set([...prev, key]));
    }
    setTimeout(() => {
      const el = document.getElementById(`cat-${key}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const total = stats.reduce((s, c) => s + c.count, 0);

  return (
    <>
      {/* Summary cards */}
      <div className="summary-row">
        {stats.map((s) => (
          <div
            key={s.key}
            className={`summary-card${focusedKey === s.key ? " active" : ""}`}
            style={{ borderLeftColor: s.border, color: s.color }}
            onClick={() => scrollToSection(s.key)}
            title={`Jump to ${CATEGORY_META[s.key].label}`}
          >
            <div className="summary-card-icon">{s.icon}</div>
            <div className="summary-card-count">{s.count}</div>
            <div className="summary-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Results accordion panel */}
      <div className="results-panel">
        <div className="results-panel-header">
          <div>
            <div className="results-panel-title">Detailed Breakdown</div>
            <div className="results-panel-sub">
              {total} transactions across {stats.filter((s) => s.count > 0).length} categories
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="reset-btn" onClick={onReset}>
              ↩ New Upload
            </button>
            <button
              className="download-btn"
              onClick={() => downloadReport(results)}
            >
              ⬇ Download Report
            </button>
          </div>
        </div>

        {stats.map(({ key }) => {
          const meta = CATEGORY_META[key];
          const items = results[key];
          const isOpen = openSections.has(key);

          return (
            <div
              key={key}
              id={`cat-${key}`}
              className="cat-section"
              style={
                focusedKey === key
                  ? { boxShadow: `inset 3px 0 0 ${meta.border}` }
                  : {}
              }
            >
              <button
                className="cat-header"
                onClick={() => toggleSection(key)}
              >
                <span className="cat-header-icon">{meta.icon}</span>
                <span className="cat-header-label">{meta.label}</span>
                <span className="cat-header-desc">{meta.desc}</span>
                <span
                  className="cat-count-badge"
                  style={{
                    background: meta.bg,
                    color: meta.color,
                    border: `1px solid ${meta.border}`,
                  }}
                >
                  {items.length}
                </span>
                <span className={`cat-chevron${isOpen ? " open" : ""}`}>▶</span>
              </button>

              {isOpen && (
                <div className="cat-body">
                  {items.length === 0 ? (
                    <div className="empty-cat">No entries in this category.</div>
                  ) : (
                    <CategoryTable catKey={key} items={items} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function CategoryTable({ catKey, items }) {
  switch (catKey) {
    case "matches":
      return (
        <table className="reco-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Platform Date</th>
              <th>Bank Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td><span className="tx-id">{item.platform.transaction_id}</span></td>
                <td><span className="date-chip">{item.platform.date || "—"}</span></td>
                <td><span className="date-chip">{item.bank.date || "—"}</span></td>
                <td><span className="mono amount-pos">${parseFloat(item.platform.amount).toFixed(2)}</span></td>
                <td><StatusTag color="#276749" bg="#c6f6d5">✓ Matched</StatusTag></td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "nextMonthSettlement":
      return (
        <table className="reco-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Platform Date</th>
              <th>Bank Date</th>
              <th>Days Gap</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td><span className="tx-id">{item.platform.transaction_id}</span></td>
                <td><span className="date-chip">{item.platform.date}</span></td>
                <td><span className="date-chip">{item.bank.date}</span></td>
                <td>
                  <span className="diff-badge diff-tiny">+{item.daysDiff ?? "?"} days</span>
                </td>
                <td><span className="mono">${parseFloat(item.platform.amount).toFixed(2)}</span></td>
                <td><StatusTag color="#0987a0" bg="#b2f5ea">Cross-month</StatusTag></td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "missingInBank":
      return (
        <table className="reco-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td><span className="tx-id">{item.transaction_id}</span></td>
                <td><span className="date-chip">{item.date || "—"}</span></td>
                <td><span className="mono amount-neg">${parseFloat(item.amount).toFixed(2)}</span></td>
                <td><StatusTag color="#c05621" bg="#fed7d7">Not in Bank</StatusTag></td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "mismatches":
      return (
        <table className="reco-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Platform Amount</th>
              <th>Bank Amount</th>
              <th>Difference</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const diff = parseFloat(item.diff);
              return (
                <tr key={i}>
                  <td><span className="tx-id">{item.platform.transaction_id}</span></td>
                  <td><span className="mono">${parseFloat(item.platform.amount).toFixed(2)}</span></td>
                  <td><span className="mono">${parseFloat(item.bank.amount).toFixed(2)}</span></td>
                  <td>
                    <span className={`diff-badge ${diff < 0 ? "diff-neg" : "diff-pos"}`}>
                      {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                    </span>
                  </td>
                  <td><span className="date-chip">{item.platform.date || "—"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );

    case "roundingIssues":
      return (
        <table className="reco-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Platform Amount</th>
              <th>Bank Amount</th>
              <th>Difference</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td><span className="tx-id">{item.platform.transaction_id}</span></td>
                <td><span className="mono">{item.platform.amount}</span></td>
                <td><span className="mono">{item.bank.amount}</span></td>
                <td><span className="diff-badge diff-tiny">{item.diff}</span></td>
                <td><StatusTag color="#b7791f" bg="#fefcbf">Rounding only</StatusTag></td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "duplicates":
      return (
        <table className="reco-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Platform Amount</th>
              <th>Platform Date</th>
              <th>Bank Entries ({items.reduce((s, i) => s + i.bankEntries.length, 0)} total)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td><span className="tx-id">{item.platform.transaction_id}</span></td>
                <td><span className="mono">${parseFloat(item.platform.amount).toFixed(2)}</span></td>
                <td><span className="date-chip">{item.platform.date || "—"}</span></td>
                <td>
                  <div className="dup-entries">
                    {item.bankEntries.map((b, j) => (
                      <div key={j} className="dup-entry-row">
                        <span className="dup-tag">#{j + 1}</span>
                        <span className="mono">${parseFloat(b.amount).toFixed(2)}</span>
                        {b.date && <span className="date-chip">{b.date}</span>}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "missingInPlatform":
      return (
        <table className="reco-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td><span className="tx-id">{item.transaction_id}</span></td>
                <td><span className="date-chip">{item.date || "—"}</span></td>
                <td><span className="mono">${parseFloat(item.amount).toFixed(2)}</span></td>
                <td><StatusTag color="#553c9a" bg="#e9d8fd">No platform entry</StatusTag></td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "refunds":
      return (
        <table className="reco-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td><span className="tx-id">{item.transaction_id}</span></td>
                <td><span className="date-chip">{item.date || "—"}</span></td>
                <td><span className="mono amount-neg">{item.amount}</span></td>
                <td><StatusTag color="#6b46c1" bg="#e9d8fd">Refund / no match</StatusTag></td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    default:
      return null;
  }
}

function StatusTag({ color, bg, children }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 5,
        fontSize: "0.7rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        background: bg,
        color,
      }}
    >
      {children}
    </span>
  );
}
