import { useState, useEffect } from "preact/hooks";
import { Photo } from "../types/photo";
import { PhotoGrid } from "../components/PhotoGrid";
import { PhotoModal } from "../components/PhotoModal";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { route } from "preact-router";

type LikedPhoto = {
  userId: string;
  photoId: string;
  timestamp: number;
};

type HomeProps = {
  user: any;
};

export function Home({ user }: HomeProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  useEffect(() => {
    if (!user) {
      route("/login");
      return;
    }
    const fetchPhotos = async () => {
      try {
        const response = await fetch("/photos.json");
        const data = await response.json();
        const processedPhotos = data.photos.map((filename: string) => ({
          filename,
          path: `/out/${filename}`,
          liked: false,
        })) as Photo[];

        if (user) {
          const q = query(
            collection(db, "likes"),
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          const likedPhotos = querySnapshot.docs.map(
            (doc) => (doc.data() as LikedPhoto).photoId
          );

          const updatedPhotos = processedPhotos.map((photo) => ({
            ...photo,
            liked: likedPhotos.includes(photo.filename),
          }));
          setPhotos(updatedPhotos);
        } else {
          setPhotos(processedPhotos);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading photos:", error);
        setLoading(false);
      }
    };
    fetchPhotos();
    return () => {
      setPhotos([]);
      setLoading(true);
    };
  }, [user]);

  useEffect(() => {
    if (selectedPhoto) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [selectedPhoto]);

  const toggleLike = async (photo: Photo) => {
    if (!user) return;

    const updatedPhotos = photos.map((p) => {
      if (p.filename === photo.filename) {
        return { ...p, liked: !p.liked };
      }
      return p;
    });
    setPhotos(updatedPhotos);

    if (selectedPhoto && selectedPhoto.filename === photo.filename) {
      setSelectedPhoto({ ...selectedPhoto, liked: !selectedPhoto.liked });
    }

    const likeRef = doc(db, "likes", `${user.uid}_${photo.filename}`);
    if (!photo.liked) {
      await setDoc(likeRef, {
        userId: user.uid,
        photoId: photo.filename,
        timestamp: Date.now(),
      });
    } else {
      await deleteDoc(likeRef);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 text-lg">Loading photos...</div>
    );
  }

  if (!user) {
    return null;
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
