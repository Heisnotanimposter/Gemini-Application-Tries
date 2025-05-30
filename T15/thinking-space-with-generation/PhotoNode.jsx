/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLoader, useThree } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { motion } from "framer-motion-3d";
import { TextureLoader, SRGBColorSpace } from "three";
import { setTargetImage } from "./actions";
import useStore from "./store"; // Import useStore to access image details

const aspectRatio = 16 / 16; // Assuming square for consistency, can be dynamic if needed
const thumbHeight = 16;
const thumbWidth = thumbHeight * aspectRatio;
const storageRoot = 'https://www.gstatic.com/aistudio/starter-apps/photosphere/';

export default function PhotoNode({
  id, // This id corresponds to an image in store.images
  x = 0,
  y = 0,
  z = 0,
  highlight,
  dim,
  xRayMode,
  // description is now fetched from store using id
}) {
  const image = useStore.use.images()?.find(img => img.id === id);
  const description = image?.description || "";
  
  let textureDataUrl = null;
  if (image && image.source === 'generated' && image.base64) {
    textureDataUrl = `data:image/jpeg;base64,${image.base64}`;
  } else if (image) {
    textureDataUrl = `${storageRoot}${image.id}`;
  }

  const texture = useLoader(TextureLoader, textureDataUrl || `${storageRoot}photo_0.jpg`); // Fallback if URL is null
  if (texture) {
    texture.colorSpace = SRGBColorSpace;
  }
  
  const opacity = highlight ? 1 : dim ? 0.1 : 1;

  return !texture || !image ? null : (
    <motion.group
      onClick={(e) => {
        e.stopPropagation();
        setTargetImage(id);
      }}
      // Positions are now directly from nodePositions which should be [0-1] range
      // The scaling by 600 happens here.
      position={[ (x - 0.5) * 600, (y - 0.5) * 600, ((z || 0.5) - 0.5) * 600]}
      // Animate to new positions if layout changes (x,y,z props will change)
      animate={{
        x: (x - 0.5) * 600,
        y: (y - 0.5) * 600,
        z: ((z || 0.5) - 0.5) * 600,
        transition: { duration: 1, ease: "circInOut" },
      }}
    >
      <Billboard>
        <mesh scale={[thumbWidth, thumbHeight, 1]}>
          <planeGeometry />
          <motion.meshStandardMaterial
            map={texture}
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            transition={{ duration: 0.5 }}
            color={xRayMode ? "#999" : "#fff"}
            transparent={opacity < 1}
          />
        </mesh>
      </Billboard>

      <Billboard>
        <Text
          font="https://storage.googleapis.com/experiments-uploads/g2demos/photo-applet/google-sans.ttf"
          fontSize={1}
          color="white"
          anchorX="start" // Changed from "center" to "start" if text is next to image
          anchorY="middle"
          position={[thumbWidth / 2 + 1, 0, 1]} // Position text to the right of the image
          maxWidth={thumbWidth * 1.5} // Allow more width for description
          fillOpacity={xRayMode ? 1 : 0}
          overflowWrap="break-word"
          lineHeight={1.2}
          textAlign="left"
        >
          {description}
        </Text>
      </Billboard>
    </motion.group>
  );
}