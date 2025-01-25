import { Photo } from "../types/photo";

interface PhotoModalProps {
  photo: Photo;
  onClose: () => void;
  onToggleLike: (photo: Photo) => void;
}

export function PhotoModal({ photo, onClose, onToggleLike }: PhotoModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-transparent rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 bg-gradient-to-br from-gray-300 to-gray-500 text-white text-sm px-2 py-1 rounded-br-md z-10">
          {photo.filename}
        </div>
        <img
          src={photo.path}
          alt={photo.filename}
          className="block w-full max-h-[90vh]"
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
    </div>
  );
}
