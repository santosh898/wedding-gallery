import { useState, useEffect } from "preact/hooks";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
// import "./home.css";

interface Comment {
  id: string;
  photoId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface Photo {
  filename: string;
  path: string;
  liked?: boolean;
  comments?: Comment[];
}

export function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [, setUserName] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const dbName = "weddingPhotosDB";
  const dbVersion = 1;

  useEffect(() => {
    const initDB = async () => {
      const request = indexedDB.open(dbName, dbVersion);

      request.onerror = (event) => {
        console.error("Database error:", event);
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("reactions")) {
          db.createObjectStore("reactions", { keyPath: "photoId" });
        }
        if (!db.objectStoreNames.contains("comments")) {
          db.createObjectStore("comments", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("userData")) {
          db.createObjectStore("userData", { keyPath: "id" });
        }
      };

      request.onsuccess = async (event: any) => {
        const db = event.target.result;
        const userDataStore = db
          .transaction("userData", "readonly")
          .objectStore("userData");

        const userRequest = userDataStore.get("userName");
        userRequest.onsuccess = () => {
          if (userRequest.result) {
            setUserName(userRequest.result.value);
          } else {
            setShowNameDialog(true);
          }
        };
      };
    };

    initDB();
    const fetchPhotos = async () => {
      try {
        const response = await fetch("/photos.json");
        const data = await response.json();
        const processedPhotos = data.photos.map((filename: string) => ({
          filename,
          path: `/out/${filename}`,
          liked: false,
          comments: [],
        })) as Photo[];

        // Load saved reactions and comments from IndexedDB
        const request = indexedDB.open(dbName, dbVersion);
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const reactionsTransaction = db.transaction(
            ["reactions"],
            "readonly"
          );
          const reactionsStore = reactionsTransaction.objectStore("reactions");
          const commentsTransaction = db.transaction(["comments"], "readonly");
          const commentsStore = commentsTransaction.objectStore("comments");

          // Get all reactions and comments
          const getAllReactions = reactionsStore.getAll();
          const getAllComments = commentsStore.getAll();

          getAllReactions.onsuccess = () => {
            const savedReactions = getAllReactions.result as {
              photoId: string;
              liked: boolean;
            }[];

            getAllComments.onsuccess = () => {
              const savedComments = getAllComments.result as Comment[];
              const updatedPhotos = processedPhotos.map((photo) => {
                const reaction = savedReactions.find(
                  (r) => r.photoId === photo.filename
                );
                const photoComments = savedComments.filter(
                  (c) => c.photoId === photo.filename
                );
                return {
                  ...photo,
                  liked: reaction ? reaction.liked : false,
                  comments: photoComments,
                };
              });
              setPhotos(updatedPhotos);
            };
          };
        };
        setLoading(false);
      } catch (error) {
        console.error("Error loading photos:", error);
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (selectedPhoto) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [selectedPhoto]);

  const handleNameSubmit = async (e: Event) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).querySelector("input");
    const name = input?.value.trim();
    if (name) {
      const request = indexedDB.open(dbName, dbVersion);
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(["userData"], "readwrite");
        const store = transaction.objectStore("userData");
        store.put({ id: "userName", value: name });
      };
      setUserName(name);
      setShowNameDialog(false);
    }
  };

  const toggleLike = async (photo: Photo) => {
    const updatedPhotos = photos.map((p) => {
      if (p.filename === photo.filename) {
        return { ...p, liked: !p.liked };
      }
      return p;
    });
    setPhotos(updatedPhotos);

    // Update selectedPhoto if the liked photo is currently selected
    if (selectedPhoto && selectedPhoto.filename === photo.filename) {
      setSelectedPhoto({ ...selectedPhoto, liked: !selectedPhoto.liked });
    }

    const request = indexedDB.open(dbName, dbVersion);
    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(["reactions"], "readwrite");
      const store = transaction.objectStore("reactions");
      store.put({ photoId: photo.filename, liked: !photo.liked });
    };
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 text-lg">Loading photos...</div>
    );
  }

  if (showNameDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
          <p className="mb-4">Please enter your name to continue:</p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              required
              minLength={2}
              maxLength={50}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

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
                onClick={() => setSelectedPhoto(photo)}
              />
              <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-2">
                <button
                  className={`text-xl transition-transform duration-200 ${
                    photo.liked ? "text-pink-500" : "text-white"
                  } hover:scale-110`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(photo);
                  }}
                >
                  {photo.liked ? "❤️" : "🤍"}
                </button>
              </div>
            </div>
          ))}
        </Masonry>
      </ResponsiveMasonry>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-transparent rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 bg-gradient-to-br from-gray-300 to-gray-500 text-white text-sm px-2 py-1 rounded-br-md z-10">
              {selectedPhoto.filename}
            </div>
            <img
              src={selectedPhoto.path}
              alt={selectedPhoto.filename}
              className="block w-full max-h-[90vh]"
            />
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-2">
              <button
                className={`text-xl transition-transform duration-200 ${
                  selectedPhoto.liked ? "text-pink-500" : "text-white"
                } hover:scale-110`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(selectedPhoto);
                }}
              >
                {selectedPhoto.liked ? "❤️" : "🤍"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
