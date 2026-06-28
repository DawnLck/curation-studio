import React, { useState, useEffect } from "react";
import { StudioScreen } from "./components/StudioScreen";
import { CurationGallery } from "./components/CurationGallery";
import { TracingBeam } from "./components/TracingBeam";

function App() {
  const [view, setView] = useState("studio");
  const [curationData, setCurationData] = useState(null);
  const [loadPath, setLoadPath] = useState("http://localhost:3001/assets/minimalist-vase/curation-data.json");

  // 动态拉取所选资产的配置文件
  useEffect(() => {
    fetch(loadPath)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setCurationData(data))
      .catch((err) => {
        console.error("Failed to load curation data from backend:", err);
        // 防御性静默降级：如果后端获取失败，降级拉取前端本地静态资源
        if (loadPath.startsWith("http://localhost:3001")) {
          const fallbackPath = loadPath.replace("http://localhost:3001", "");
          fetch(fallbackPath)
            .then((res) => res.json())
            .then((data) => setCurationData(data))
            .catch((e) => console.error("Fallback load failed:", e));
        }
      });
  }, [loadPath]);

  const handleGenerate = (mode, curationId) => {
    if (mode === "demo") {
      setLoadPath("http://localhost:3001/assets/minimalist-vase/curation-data.json");
    } else {
      setLoadPath(`http://localhost:3001/assets/generated/${curationId}/curation-data.json`);
    }
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
            <CurationGallery data={curationData} onReset={handleReset} loadPath={loadPath} onUpdateCurationData={setCurationData} />
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
