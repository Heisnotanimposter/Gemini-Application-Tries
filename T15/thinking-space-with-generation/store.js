/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import 'immer'
import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {createSelectorFunctions} from 'auto-zustand-selectors-hook'

// Image object structure:
// For initial images (from meta.json): { id: string, description: string }
// For generated images: { id: string, description: string (prompt), base64: string, source: 'generated' }

export default createSelectorFunctions(
  create(
    immer(() => ({
      didInit: false,
      images: null, // Array of image objects
      layout: 'sphere',
      layouts: null,
      nodePositions: null,
      highlightNodes: null,
      isFetching: false,
      isSidebarOpen: false,
      xRayMode: false,
      targetImage: null,
      caption: null,
      resetCam: false,

      // Image Generation State (for the temporary gallery)
      imageGenerationPrompt: '',
      numberOfImagesToGenerate: 1,
      generatedImages: [], // Array of { id: string, base64: string, prompt: string } - temporary batch
      selectedGeneratedImageIds: [], // Array of ids from the temporary generatedImages batch
      isGeneratingImages: false,
      imageGenerationError: null,
    }))
  )
)