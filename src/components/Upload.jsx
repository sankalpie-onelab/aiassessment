import { parseCSV } from "../utils/parseCSV";

export default function Upload({ onDataReady }) {
  const handleFiles = async (e) => {
    const files = e.target.files;

    if (files.length !== 2) {
      alert("Upload both CSV files");
      return;
    }

    const texts = await Promise.all([
      files[0].text(),
      files[1].text(),
    ]);

    const data1 = parseCSV(texts[0]);
    const data2 = parseCSV(texts[1]);

    // assume order: platform first, bank second
    onDataReady(data1, data2);
  };

  return (
    <div>
      <input type="file" multiple accept=".csv" onChange={handleFiles} />
    </div>
  );
}
