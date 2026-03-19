export function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
  
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = values[i].trim();
      });
      return obj;
    });
  }