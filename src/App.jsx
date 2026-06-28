import React, { useState } from "react";
import { StudioScreen } from "./components/StudioScreen";
import { CurationGallery } from "./components/CurationGallery";
import { TracingBeam } from "./components/TracingBeam";
import curationData from "../public/assets/minimalist-vase/curation-data.json";

function App() {
  const [view, setView] = useState("studio");

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
        <TracingBeam>
          <CurationGallery data={curationData} onReset={handleReset} />
        </TracingBeam>
      )}
    </div>
  );
}

export default App;
