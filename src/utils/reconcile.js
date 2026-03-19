export function reconcileData(platform, bank) {
    matches: [],
    mismatches: [],
    missingInBank: [],
    missingInPlatform: [],
    duplicates: [],
    roundingIssues: [],
  };

  const bankMap = {};

  // build bank map
  bank.forEach((b) => {
    if (!bankMap[b.transaction_id]) {
      bankMap[b.transaction_id] = [];
    }
    bankMap[b.transaction_id].push(b);
  });

  // check platform transactions
  platform.forEach((p) => {
    const matches = bankMap[p.transaction_id];

    if (!matches) {
      result.missingInBank.push(p);
    } else {
      if (matches.length > 1) {
        result.duplicates.push({ transaction: p, entries: matches });
      }

      const b = matches[0];
      const pAmount = parseFloat(p.amount);
      const bAmount = parseFloat(b.amount);

      if (Math.abs(pAmount - bAmount) === 0) {
        result.matches.push(p);
      } else if (Math.abs(pAmount - bAmount) <= 0.01) {
        result.roundingIssues.push({ p, b });
      } else {
        result.mismatches.push({ p, b });
      }
    }
  });

  // check bank-only entries
  const platformIds = new Set(platform.map((p) => p.transaction_id));

  bank.forEach((b) => {
    if (!platformIds.has(b.transaction_id)) {
      result.missingInPlatform.push(b);
    }
  });

  return result;
}