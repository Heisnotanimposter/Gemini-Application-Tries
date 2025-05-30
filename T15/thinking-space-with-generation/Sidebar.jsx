/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import c from "clsx";
import useStore from "./store";
import { setSidebarOpen, setTargetImage } from "./actions";

const truncateDescription = (description, wordLimit = 7) => {
  if (!description) {
    return "";
  }
  const words = description.split(" ");
  if (words.length <= wordLimit) {
    return description;
  }
  return words.slice(0, wordLimit).join(" ") + " ...";
};

const Sidebar = () => {
  const images = useStore.use.images();
  const isSidebarOpen = useStore.use.isSidebarOpen();
  const storageRoot = 'https://www.gstatic.com/aistudio/starter-apps/photosphere/';

  return (
    <aside className={c("sidebar", { open: isSidebarOpen })}>
      <button
        className="closeButton"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
      >
        <span className="icon">close</span>
      </button>

      <ul>
        {images?.map((image) => {
          let thumbnailUrl = "";
          if (image.source === 'generated' && image.base64) {
            thumbnailUrl = `data:image/jpeg;base64,${image.base64}`;
          } else {
            thumbnailUrl = `${storageRoot}${image.id}`;
          }

          return (
            <li key={image.id} onClick={() => setTargetImage(image.id)}
              role="button" 
              tabIndex={0} 
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTargetImage(image.id); }}
              aria-label={`View details for image: ${image.description}`}
            >
              <img
                src={thumbnailUrl}
                alt={truncateDescription(image.description, 3)}
                className="thumbnail"
              />
              <p>{image.description}</p>
            </li>
          );
        })}
        {(!images || images.length === 0) && <li>No images available.</li>}
      </ul>
    </aside>
  );
};

export default Sidebar;