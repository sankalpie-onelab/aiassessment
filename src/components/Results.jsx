export default function Results({ results }) {
    return (
      <div>
        <h2>Results</h2>
  
        <h3>Matches: {results.matches.length}</h3>
        <h3>Mismatches: {results.mismatches.length}</h3>
        <h3>Missing in Bank: {results.missingInBank.length}</h3>
        <h3>Missing in Platform: {results.missingInPlatform.length}</h3>
        <h3>Duplicates: {results.duplicates.length}</h3>
        <h3>Rounding Issues: {results.roundingIssues.length}</h3>
      </div>
    );
  }
  