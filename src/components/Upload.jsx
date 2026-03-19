import { useState } from "react";
import { parseCSV } from "../utils/parseCSV";

export default function Upload({ onDataReady }) {
  const [platformFile, setPlatformFile] = useState(null);
  const [bankFile, setBankFile] = useState(null);
  const [error, setError] = useState("");

  const handleRun = async () => {
    setError("");
    try {
      const [platformText, bankText] = await Promise.all([
        platformFile.text(),
        bankFile.text(),
      ]);
      const platformData = parseCSV(platformText);
      const bankData = parseCSV(bankText);
      onDataReady(platformData, bankData);
    } catch {
      setError("Failed to parse CSV files. Please check the file format.");
    }
  };

  const bothReady = platformFile && bankFile;

  return (
    <div className="upload-card">
      <div className="upload-card-title">Upload CSV Files</div>
      <div className="upload-card-desc">
        Select your Platform Transactions CSV and Bank Statement CSV to begin reconciliation.
      </div>

      <div className="upload-grid">
        <FileZone
          label="Platform Transactions"
          hint="platform_transactions.csv"
          icon="🏪"
          file={platformFile}
          onChange={setPlatformFile}
        />
        <FileZone
          label="Bank Statement"
          hint="bank_statement.csv"
          icon="🏦"
          file={bankFile}
          onChange={setBankFile}
        />
      </div>

      {error && (
        <div style={{ color: "#c53030", fontSize: "0.8rem", marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}

      <button className="run-btn" onClick={handleRun} disabled={!bothReady}>
        <span>▶</span>
        Run Reconciliation
      </button>

      {!bothReady && (
        <p className="run-btn-hint">
          {!platformFile && !bankFile
            ? "Upload both files to continue"
            : !platformFile
            ? "Platform CSV missing"
            : "Bank CSV missing"}
        </p>
      )}
    </div>
  );
}

function FileZone({ label, hint, icon, file, onChange }) {
  return (
    <div className={`file-zone${file ? " has-file" : ""}`}>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => onChange(e.target.files[0] || null)}
      />
      <span className="file-zone-icon">{file ? "✅" : icon}</span>
      <div className="file-zone-label">{label}</div>
      <div className="file-zone-hint">{hint}</div>
      {file && <div className="file-zone-name">📄 {file.name}</div>}
    </div>
  );
}
