import React, { useState, useEffect } from "react";
import { StudioScreen } from "./components/StudioScreen";
import { CurationGallery } from "./components/CurationGallery";
import { TracingBeam } from "./components/TracingBeam";

function App() {
  const [view, setView] = useState("studio");
  const [curationData, setCurationData] = useState(null);

  useEffect(() => {
    fetch("/assets/minimalist-vase/curation-data.json")
      .then((res) => res.json())
      .then((data) => setCurationData(data))
      .catch((err) => console.error("Failed to load curation data:", err));
  }, []);

  const handleGenerate = () => {
    setView("gallery");
  };

  const handleReset = () => {
    setView("studio");
  };

  return (
    <div className="w-full min-h-screen bg-sand-200">
      {view === "studio" ? (
        <StudioScreen onGenerate={handleGenerate} />
      ) : (
        curationData ? (
          <TracingBeam>
            <CurationGallery data={curationData} onReset={handleReset} />
          </TracingBeam>
        ) : (
          <div className="w-full min-h-screen flex items-center justify-center font-serif text-charcoal">
            加载策展数据中...
          </div>
        )
      )}

    </div>
  );
}

export default App;
