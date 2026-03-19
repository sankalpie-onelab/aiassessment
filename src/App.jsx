import { useState } from "react";
import Upload from "./components/Upload";
import Results from "./components/Results";
import { reconcileData } from "./utils/reconcile";

function StepIndicator({ step }) {
  const steps = ["Upload CSVs", "Reconcile", "View Results"];
  return (
    <div className="reco-steps">
      {steps.map((label, i) => {
        const num = i + 1;
        const isDone = step > num;
        const isActive = step === num;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div className={`reco-step${isDone ? " done" : isActive ? " active" : ""}`}>
              <span className="reco-step-num">
                {isDone ? "✓" : num}
              </span>
              {label}
            </div>
            {i < steps.length - 1 && (
              <div className={`reco-step-divider${isDone ? " done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [results, setResults] = useState(null);

  const handleData = (platformData, bankData) => {
    const res = reconcileData(platformData, bankData);
    setResults(res);
  };

  const handleReset = () => setResults(null);

  const currentStep = results ? 3 : 1;

  return (
    <div>
      <header className="reco-header">
        <div className="reco-header-left">
          <div className="reco-header-icon">⚖️</div>
          <div>
            <h1>Reconciliation Dashboard</h1>
            <div className="reco-header-sub">
              Platform vs Bank Transaction Reconciliation
            </div>
          </div>
        </div>
        <div className="reco-header-badge">Finance Tool</div>
      </header>

      <main className="reco-main">
        <StepIndicator step={currentStep} />

        {!results && (
          <div className="info-box">
            <span>ℹ️</span>
            <span>
              Upload your <strong>Platform Transactions CSV</strong> and{" "}
              <strong>Bank Statement CSV</strong>. The tool will automatically
              parse, match, and categorize every transaction into 8 case types.
            </span>
          </div>
        )}

        <Upload onDataReady={handleData} />

        {results && (
          <Results results={results} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
