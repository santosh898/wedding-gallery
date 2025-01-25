import { useState, useEffect } from "preact/hooks";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import "./app.css";

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

export function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
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

  if (loading) {
    return <div class="loading">Loading photos...</div>;
  }

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

  const addComment = async (photo: Photo) => {
    if (!newComment.trim() || !userName) return;

    const comment: Comment = {
      id: Date.now().toString(),
      photoId: photo.filename,
      userName,
      text: newComment.trim(),
      timestamp: Date.now(),
    };

    const updatedPhotos = photos.map((p) => {
      if (p.filename === photo.filename) {
        return {
          ...p,
          comments: [...(p.comments || []), comment],
        };
      }
      return p;
    });

    setPhotos(updatedPhotos);
    setNewComment("");

    const request = indexedDB.open(dbName, dbVersion);
    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(["comments"], "readwrite");
      const store = transaction.objectStore("comments");
      store.put(comment);
    };
  };

  if (showNameDialog) {
    return (
      <div class="name-dialog-overlay">
        <div class="name-dialog">
          <h2>Welcome!</h2>
          <p>Please enter your name to continue:</p>
          <form onSubmit={handleNameSubmit}>
            <input
              type="text"
              placeholder="Your name"
              required
              minLength={2}
              maxLength={50}
            />
            <button type="submit">Continue</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div class="gallery">
      <ResponsiveMasonry
        columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3, 1200: 4 }}
      >
        <Masonry>
          {photos.map((photo, index) => (
            <div key={index} class="photo-item">
              <div class="filename-overlay">{photo.filename}</div>
              <img
                src={photo.path}
                alt={`Wedding photo ${index + 1}`}
                loading="lazy"
                onClick={() => setSelectedPhoto(photo)}
              />
              <div class="photo-actions">
                <button
                  class={`heart-button ${photo.liked ? "liked" : ""}`}
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
        <div class="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div class="modal-content" onClick={(e) => e.stopPropagation()}>
            <div class="filename-overlay">{selectedPhoto.filename}</div>
            <img src={selectedPhoto.path} alt={selectedPhoto.filename} />
            <div class="photo-actions">
              <button
                class={`heart-button ${selectedPhoto.liked ? "liked" : ""}`}
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
