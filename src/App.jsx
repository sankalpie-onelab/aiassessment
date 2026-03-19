import { useState } from "react";
import Upload from "./components/Upload";
import Results from "./components/Results";
import { reconcileData } from "./utils/reconcile";

export default function App() {
  const [results, setResults] = useState(null);

  const handleData = (platformData, bankData) => {
    const res = reconcileData(platformData, bankData);
    setResults(res);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Reconciliation Tool</h1>
      <Upload onDataReady={handleData} />
      {results && <Results results={results} />}
    </div>
  );
}