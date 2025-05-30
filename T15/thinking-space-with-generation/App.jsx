/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useRef, useState, useEffect } from "react";
import c from "clsx";
import PhotoViz from "./PhotoViz";
import useStore from "./store";
import Sidebar from "./Sidebar";

import {
  setLayout,
  sendQuery,
  clearQuery,
  setXRayMode,
  toggleSidebar,
  // Image Generation Actions
  setImageGenerationPrompt,
  setNumberOfImagesToGenerate,
  handleGenerateImages,
  toggleSelectGeneratedImage,
  handleClearGeneratedImages,
  downloadSelectedGeneratedImages,
  addSelectedGeneratedImagesToSpace, // Import the new action
} from "./actions";

const searchPresets = [
  'winter', 
  'mathematical concepts', 
  'underwater animals', 
  'circular shapes'
];

export default function App() {
  const layout = useStore.use.layout();
  const isFetching = useStore.use.isFetching(); // For original image search
  const xRayMode = useStore.use.xRayMode();
  const caption = useStore.use.caption();
  const isSidebarOpen = useStore.use.isSidebarOpen();
  const highlightNodes = useStore.use.highlightNodes();
  const [searchValue, setSearchValue] = useState(""); 
  const [searchPresetIdx, setSearchPresetIdx] = useState(0);
  const inputRef = useRef(null);

  // Image Generation State
  const imageGenerationPrompt = useStore.use.imageGenerationPrompt();
  const numberOfImagesToGenerate = useStore.use.numberOfImagesToGenerate();
  const generatedImages = useStore.use.generatedImages();
  const selectedGeneratedImageIds = useStore.use.selectedGeneratedImageIds();
  const isGeneratingImages = useStore.use.isGeneratingImages();
  const imageGenerationError = useStore.use.imageGenerationError();

  useEffect(() => {
    const interval = setInterval(() =>
      setSearchPresetIdx(n => n === searchPresets.length - 1 ? 0 : n + 1)
    , 5000);

    return () => clearInterval(interval);
  }, []);

  const onGenerateImages = () => {
    if (imageGenerationPrompt.trim() && !isGeneratingImages) {
      handleGenerateImages();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchValue.trim().length) {
      sendQuery(searchValue.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    clearQuery();
    inputRef.current?.focus();
  };

  return (
    <main>
      <PhotoViz />
      <Sidebar />

      { (generatedImages.length > 0 || isGeneratingImages || imageGenerationError) && (
        <section className="image-generation-section" aria-live="polite">
          <div className="image-generation-status">
            {isGeneratingImages && !imageGenerationError && <div className="spinner-message">Generating images... <img src="https://storage.googleapis.com/experiments-uploads/g2demos/photo-applet/spinner.svg" alt="loading animation"/></div>}
            {imageGenerationError && <div className="error-message" role="alert">Error: {imageGenerationError}</div>}
          </div>
          
          {generatedImages.length > 0 && (
            <>
              <div className="image-generation-gallery" role="listbox">
                {generatedImages.map(img => (
                  <img
                    key={img.id}
                    src={`data:image/jpeg;base64,${img.base64}`}
                    alt={img.prompt}
                    className={c({ selected: selectedGeneratedImageIds.includes(img.id) })}
                    onClick={() => toggleSelectGeneratedImage(img.id)}
                    role="option"
                    aria-selected={selectedGeneratedImageIds.includes(img.id)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSelectGeneratedImage(img.id); }}
                    aria-label={`Generated image: ${img.prompt}. Click or press Enter to select/deselect.`}
                  />
                ))}
              </div>
              <div className="image-generation-actions">
                <button 
                  onClick={addSelectedGeneratedImagesToSpace}
                  disabled={selectedGeneratedImageIds.length === 0 || isGeneratingImages}
                  aria-label="Add selected images to the 3D visualization space"
                >
                  <span className="icon">add_to_photos</span> Add to Space
                </button>
                <button 
                  onClick={downloadSelectedGeneratedImages} 
                  disabled={selectedGeneratedImageIds.length === 0 || isGeneratingImages}
                  aria-label="Download selected generated images"
                >
                  <span className="icon">download</span> Download Selected
                </button>
                <button 
                  onClick={handleClearGeneratedImages} 
                  disabled={isGeneratingImages}
                  aria-label="Clear all generated images from this temporary gallery"
                >
                  <span className="icon">delete</span> Clear Images
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <footer>
        {caption && (
          <div className="caption">
            {caption}
            <button onClick={clearQuery} aria-label="Clear search results and caption">
              <span className="icon">close</span>
            </button>
          </div>
        )}

        <div className="input">
          <input
            ref={inputRef}
            type="text"
            placeholder={`Try "${searchPresets[searchPresetIdx]}"`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            aria-label="Search for images by description in the 3D visualization"
          />
          {isFetching && (
            <img
              className="spinner active"
              src="https://storage.googleapis.com/experiments-uploads/g2demos/photo-applet/spinner.svg"
              alt="loading animation"
            />
          )}
          {searchValue.length > 0 && !isFetching && (
            <button
              className="clearButton active"
              onClick={handleClearSearch}
              aria-label="Clear search input"
            >
              <span className="icon">close</span>
            </button>
          )}
        </div>

        <div className="controls">
          <div>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              aria-label="Select layout mode for 3D visualization"
            >
              <option value="sphere">Sphere</option>
              <option value="grid">Grid</option>
            </select>
          </div>
          <div>
            <label htmlFor="xray-checkbox">
              <input
                type="checkbox"
                id="xray-checkbox"
                checked={xRayMode}
                onChange={() => setXRayMode(!xRayMode)}
                aria-pressed={xRayMode}
              />
              <span className="icon">visibility</span> X-Ray
            </label>
          </div>
          <div>
            <button onClick={() => toggleSidebar()} aria-expanded={isSidebarOpen} aria-controls="sidebar-list">
              <span className="icon">list</span> List
            </button>
          </div>
        </div>

        {/* Image Generation Controls in Footer */}
        <div className="image-generation-controls-footer">
          <input
            type="text"
            placeholder="Describe an image to generate..."
            value={imageGenerationPrompt}
            onChange={(e) => setImageGenerationPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onGenerateImages(); }}
            aria-label="Image generation prompt"
            disabled={isGeneratingImages}
          />
          <select
            value={numberOfImagesToGenerate}
            onChange={(e) => setNumberOfImagesToGenerate(Number(e.target.value))}
            aria-label="Number of images to generate"
            disabled={isGeneratingImages}
          >
            <option value={1}>1 Image</option>
            <option value={2}>2 Images</option>
            <option value={4}>4 Images</option>
          </select>
          <button 
            onClick={onGenerateImages} 
            disabled={isGeneratingImages || !imageGenerationPrompt.trim()}
            aria-label={isGeneratingImages ? "Generating images..." : "Generate images from prompt"}
          >
            {isGeneratingImages ? (
              <>
                <img className="button-spinner" src="https://storage.googleapis.com/experiments-uploads/g2demos/photo-applet/spinner.svg" alt="Generating..." />
                Generating...
              </>
            ) : (
              <>
                <span className="icon">auto_awesome</span> Generate
              </>
            )}
          </button>
        </div>
      </footer>
    </main>
  );
}
