import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { Photo } from "../types/photo";

interface PhotoGridProps {
  photos: Photo[];
  onPhotoSelect: (photo: Photo) => void;
  onToggleLike: (photo: Photo) => void;
}

export function PhotoGrid({
  photos,
  onPhotoSelect,
  onToggleLike,
}: PhotoGridProps) {
  return (
    <div className="p-4 min-h-screen">
      <ResponsiveMasonry
        columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3, 1200: 4 }}
      >
        <Masonry>
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative mb-4 break-inside-avoid overflow-hidden rounded-lg shadow-md bg-gray-100"
            >
              <div className="absolute top-0 left-0 bg-gradient-to-br from-gray-300 to-gray-500 text-white text-sm px-2 py-1 rounded-br-md z-10">
                {photo.filename}
              </div>
              <img
                src={photo.path}
                alt={`Wedding photo ${index + 1}`}
                loading="lazy"
                className="w-full transition-transform duration-300 hover:scale-105"
                onClick={() => onPhotoSelect(photo)}
              />
              <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-2">
                <button
                  className={`text-xl transition-transform duration-200 ${
                    photo.liked ? "text-pink-500" : "text-white"
                  } hover:scale-110`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(photo);
                  }}
                >
                  {photo.liked ? "❤️" : "🤍"}
                </button>
              </div>
            </div>
          ))}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
}
