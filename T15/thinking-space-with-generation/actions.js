/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store'
import {queryLlm, generateImagesApi} from './llm' 
import {queryPrompt} from './prompts'

const get = useStore.getState
const set = useStore.setState

export const init = async () => {
  if (get().didInit) {
    return
  }

  set(state => {
    state.didInit = true
  })

  const [rawImages, sphere, umapGrid] = await Promise.all(
    ['meta', 'sphere', 'umap-grid'].map(
      path => fetch(path + '.json').then(res => res.json())
    )
  )

  const imagesWithSource = rawImages.map(img => ({ ...img, source: 'initial' }));

  set(state => {
    state.images = imagesWithSource;
    state.layouts = {
      sphere: sphere || {}, // Ensure sphere is an object
      grid: Object.fromEntries(
        Object.entries(umapGrid || {}).map(([k, [x, y]]) => [ // Ensure umapGrid is an object
          k,
          [x, y / (16 / 9) + 0.25, 0.5] // Add default Z for grid
        ])
      )
    }
    // Initialize nodePositions, will be correctly set by the first setLayout call
    state.nodePositions = {}; 
  })

  setLayout('sphere') // This will populate nodePositions correctly from state.layouts.sphere
}

export const setLayout = layout =>
  set(state => {
    state.layout = layout;
    // Directly use the positions from the target layout's store.
    // This assumes state.layouts[layout] contains all image IDs and their positions.
    // PhotoNode.jsx handles cases where a specific image ID might be missing from nodePositions
    // by not rendering the node if its position is undefined.
    state.nodePositions = state.layouts[layout] || {};
  })

export const setSphereLayout = positions =>
  set(state => {
    state.layouts.sphere = positions
  })

export const sendQuery = async query => {
  set(state => {
    state.isFetching = true
    state.targetImage = null
    state.resetCam = true
    state.caption = null
  })
  try {
    const corpus = get().images.filter(img => img.source === 'initial' && img.description); // Only query initial images with descriptions
    const res = await queryLlm({prompt: queryPrompt(corpus, query)})
    try{
      const resJ = JSON.parse(res.replace('```json','').replace('```',''));
      set(state => {
        state.highlightNodes = resJ.filenames
        state.caption = resJ.commentary
      })
    }catch(e){
      console.error(e)
       set(state => {
        state.caption = "Sorry, I couldn't understand that. Please try a different query."
        state.highlightNodes = null;
      })
    }

  } catch(e) {
    console.error(e);
    set(state => {
      state.caption = "An error occurred while fetching results."
      state.highlightNodes = null;
    })
  } finally {
    set(state => {
      state.isFetching = false
    })
  }
}


export const clearQuery = () =>
  set(state => {
    state.highlightNodes = null
    state.caption = null
    state.targetImage = null
  })

export const setXRayMode = xRayMode =>
  set(state => {
    state.xRayMode = xRayMode
  })

export const setTargetImage = async targetImageId => {
  const currentTargetImage = get().targetImage;
  
  if (targetImageId === currentTargetImage && targetImageId !== null) { 
    targetImageId = null; 
  }

  const shouldResetCam = !targetImageId && currentTargetImage !== null; 

  set(state => {
    state.targetImage = targetImageId;
    state.highlightNodes = null; 
    if (shouldResetCam) { 
        state.resetCam = true;
    }
  });

  if (!targetImageId) {
     set(state => { state.isFetching = false; }); 
    return;
  }
  
  const image = get().images.find(img => img.id === targetImageId);
  if (image && image.source === 'generated') {
    set(state => {
      state.caption = image.description; 
      state.isFetching = false;
    });
    return;
  }
  
  set(state => {
    state.isFetching = false;
  });
};


export const toggleSidebar = () =>
  set(state => {
    state.isSidebarOpen = !state.isSidebarOpen
  })

export const setSidebarOpen = isOpen =>
  set(state => {
    state.isSidebarOpen = isOpen
  })

// Image Generation Actions
export const setImageGenerationPrompt = prompt =>
  set(state => {
    state.imageGenerationPrompt = prompt
  })

export const setNumberOfImagesToGenerate = number =>
  set(state => {
    state.numberOfImagesToGenerate = Number(number)
  })

export const handleGenerateImages = async () => {
  const { imageGenerationPrompt, numberOfImagesToGenerate } = get();
  if (!imageGenerationPrompt.trim()) {
    set(state => {
      state.imageGenerationError = "Prompt cannot be empty.";
    });
    return;
  }

  set(state => {
    state.isGeneratingImages = true;
    state.imageGenerationError = null;
    state.selectedGeneratedImageIds = []; 
  });

  try {
    const imageResults = await generateImagesApi(imageGenerationPrompt, numberOfImagesToGenerate); 
    set(state => {
      const newGeneratedImages = imageResults.map((imgData, index) => ({
        id: `gen-${Date.now()}-${index}`, 
        base64: imgData.base64,
        prompt: imageGenerationPrompt, 
      }));
      state.generatedImages = [...state.generatedImages, ...newGeneratedImages];
    });
  } catch (error) {
    console.error("Failed to generate images:", error);
    set(state => {
      state.imageGenerationError = error.message || "Failed to generate images. Please try again.";
    });
  } finally {
    set(state => {
      state.isGeneratingImages = false;
    });
  }
};

export const toggleSelectGeneratedImage = imageId =>
  set(state => {
    const currentIndex = state.selectedGeneratedImageIds.indexOf(imageId);
    if (currentIndex === -1) {
      state.selectedGeneratedImageIds.push(imageId);
    } else {
      state.selectedGeneratedImageIds.splice(currentIndex, 1);
    }
  });

export const handleClearGeneratedImages = () =>
  set(state => {
    state.generatedImages = [];
    state.selectedGeneratedImageIds = [];
    state.imageGenerationError = null;
  });

export const downloadSelectedGeneratedImages = () => {
  const { generatedImages, selectedGeneratedImageIds } = get();
  selectedGeneratedImageIds.forEach(id => {
    const image = generatedImages.find(img => img.id === id);
    if (image) {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${image.base64}`;
      const sanitizedPrompt = image.prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      link.download = `generated_image_${sanitizedPrompt}_${image.id}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  });
};

export const addSelectedGeneratedImagesToSpace = () => {
  const { generatedImages, selectedGeneratedImageIds } = get();
  const imagesToAdd = generatedImages.filter(img => selectedGeneratedImageIds.includes(img.id));

  if (imagesToAdd.length === 0) return;

  set(state => {
    // Ensure layout objects exist
    state.layouts.sphere = state.layouts.sphere || {};
    state.layouts.grid = state.layouts.grid || {};

    let currentGridItemCount = Object.keys(state.layouts.grid).length;

    const newImageObjects = [];
    const newNodePositionsUpdates = {};
    const newSphereLayoutUpdates = {};
    const newGridLayoutUpdates = {};

    imagesToAdd.forEach(genImg => {
      const imageId = genImg.id;

      const newImage = {
        id: imageId,
        description: genImg.prompt,
        base64: genImg.base64,
        source: 'generated',
      };
      newImageObjects.push(newImage);

      // 1. Calculate and store Sphere Position
      const spherePos = [Math.random(), Math.random(), Math.random()];
      newSphereLayoutUpdates[imageId] = spherePos;

      // 2. Calculate and store Grid Position
      // Assumes 10 columns, values normalized 0-1 for x, raw y. Z is 0.5.
      const gridX = (currentGridItemCount % 10) * 0.1; 
      const rawGridY = Math.floor(currentGridItemCount / 10) * 0.1;
      const transformedGridY = rawGridY / (16 / 9) + 0.25; // Apply transformation
      const gridPos = [gridX, transformedGridY, 0.5]; 
      newGridLayoutUpdates[imageId] = gridPos;
      
      currentGridItemCount++;

      // 3. Determine position for current layout to update nodePositions
      if (state.layout === 'sphere') {
        newNodePositionsUpdates[imageId] = spherePos;
      } else if (state.layout === 'grid') {
        newNodePositionsUpdates[imageId] = gridPos;
      } else {
        // Fallback for any other layouts (though only sphere and grid are currently defined)
        newNodePositionsUpdates[imageId] = [0.5, 0.5, 0.5];
      }
    });

    state.images = [...state.images, ...newImageObjects];
    state.nodePositions = { ...state.nodePositions, ...newNodePositionsUpdates };
    state.layouts.sphere = { ...state.layouts.sphere, ...newSphereLayoutUpdates };
    state.layouts.grid = { ...state.layouts.grid, ...newGridLayoutUpdates };

    // Clean up from temporary generated images
    state.generatedImages = state.generatedImages.filter(img => !selectedGeneratedImageIds.includes(img.id));
    state.selectedGeneratedImageIds = [];
  });
};

export const setResetCamFlag = (value) => set(state => {
  state.resetCam = value;
});

init();
