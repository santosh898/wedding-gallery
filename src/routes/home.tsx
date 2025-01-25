import { useState, useEffect } from "preact/hooks";
import { Photo } from "../types/photo";
import { PhotoGrid } from "../components/PhotoGrid";
import { PhotoModal } from "../components/PhotoModal";
import { NameDialog } from "../components/NameDialog";

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
              const updatedPhotos = processedPhotos.map((photo) => {
                const reaction = savedReactions.find(
                  (r) => r.photoId === photo.filename
                );
                return {
                  ...photo,
                  liked: reaction ? reaction.liked : false,
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

  const handleNameSubmit = async (name: string) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(["userData"], "readwrite");
      const store = transaction.objectStore("userData");
      store.put({ id: "userName", value: name });
    };
    setUserName(name);
    setShowNameDialog(false);
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
    return <NameDialog onSubmit={handleNameSubmit} />;
  }

  return (
    <>
      <PhotoGrid
        photos={photos}
        onPhotoSelect={setSelectedPhoto}
        onToggleLike={toggleLike}
      />
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onToggleLike={toggleLike}
        />
      )}
    </>
  );
}
