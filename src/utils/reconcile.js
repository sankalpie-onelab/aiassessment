export function reconcileData(platform, bank) {
  const result = {
    matches: [],
    nextMonthSettlement: [],
    missingInBank: [],
    mismatches: [],
    roundingIssues: [],
    duplicates: [],
    missingInPlatform: [],
    refunds: [],
  };

  const bankMap = {};
  bank.forEach((b) => {
    if (!bankMap[b.transaction_id]) {
      bankMap[b.transaction_id] = [];
    }
    bankMap[b.transaction_id].push(b);
  });

  const platformIds = new Set(platform.map((p) => p.transaction_id));

  platform.forEach((p) => {
    const bankEntries = bankMap[p.transaction_id];

    if (!bankEntries) {
      result.missingInBank.push(p);
      return;
    }

    // Duplicate: same transaction_id appears more than once in bank
    if (bankEntries.length > 1) {
      result.duplicates.push({ platform: p, bankEntries });
      return;
    }

    const b = bankEntries[0];
    const pAmount = parseFloat(p.amount);
    const bAmount = parseFloat(b.amount);
    const diff = Math.abs(pAmount - bAmount);

    if (diff <= 0.001) {
      // Check if dates fall in different months → next month settlement
      if (p.date && b.date) {
        const pDate = new Date(p.date);
        const bDate = new Date(b.date);
        if (
          !isNaN(pDate) &&
          !isNaN(bDate) &&
          (pDate.getMonth() !== bDate.getMonth() ||
            pDate.getFullYear() !== bDate.getFullYear())
        ) {
          const daysDiff = Math.round(
            (bDate - pDate) / (1000 * 60 * 60 * 24)
          );
          result.nextMonthSettlement.push({ platform: p, bank: b, daysDiff });
          return;
        }
      }
      result.matches.push({ platform: p, bank: b });
    } else if (diff <= 0.01) {
      result.roundingIssues.push({
        platform: p,
        bank: b,
        diff: (pAmount - bAmount).toFixed(4),
      });
    } else {
      result.mismatches.push({
        platform: p,
        bank: b,
        diff: (pAmount - bAmount).toFixed(2),
      });
    }
  });

  // Bank entries with no matching platform entry
  bank.forEach((b) => {
    if (!platformIds.has(b.transaction_id)) {
      const amount = parseFloat(b.amount);
      if (amount < 0) {
        result.refunds.push(b);
      } else {
        result.missingInPlatform.push(b);
      }
    }
  });

  return result;
}

export function getSummaryStats(results) {
  return [
    {
      key: "matches",
      label: "Matches",
      icon: "✅",
      color: "#276749",
      bg: "#f0fff4",
      border: "#48bb78",
      count: results.matches.length,
    },
    {
      key: "nextMonthSettlement",
      label: "Next Month",
      icon: "📅",
      color: "#0987a0",
      bg: "#e6fffa",
      border: "#38b2ac",
      count: results.nextMonthSettlement.length,
    },
    {
      key: "missingInBank",
      label: "Missing in Bank",
      icon: "❌",
      color: "#c05621",
      bg: "#fffaf0",
      border: "#f6ad55",
      count: results.missingInBank.length,
    },
    {
      key: "mismatches",
      label: "Mismatches",
      icon: "💸",
      color: "#c53030",
      bg: "#fff5f5",
      border: "#fc8181",
      count: results.mismatches.length,
    },
    {
      key: "roundingIssues",
      label: "Rounding",
      icon: "💰",
      color: "#b7791f",
      bg: "#fffff0",
      border: "#f6e05e",
      count: results.roundingIssues.length,
    },
    {
      key: "duplicates",
      label: "Duplicates",
      icon: "🔁",
      color: "#2b6cb0",
      bg: "#ebf8ff",
      border: "#63b3ed",
      count: results.duplicates.length,
    },
    {
      key: "missingInPlatform",
      label: "Missing in Platform",
      icon: "🔄",
      color: "#553c9a",
      bg: "#faf5ff",
      border: "#9f7aea",
      count: results.missingInPlatform.length,
    },
    {
      key: "refunds",
      label: "Refunds",
      icon: "💳",
      color: "#6b46c1",
      bg: "#fdf4ff",
      border: "#b794f4",
      count: results.refunds.length,
    },
  ];
}
