import { useState, useEffect } from "preact/hooks";
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { route } from "preact-router";
import { PhotoModal } from "../components/PhotoModal";
import { Photo } from "../types/photo";

type LikedPhoto = {
  userId: string;
  photoId: string;
  timestamp: number;
};

type UserLikes = {
  userId: string;
  userName: string;
  photos: string[];
};

type LikesProps = {
  user: any;
};

export default function Likes({ user }: LikesProps) {
  const [userLikes, setUserLikes] = useState<UserLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    if (!user) {
      route("/login");
      return;
    }

    const fetchLikes = async () => {
      try {
        const likesQuery = query(
          collection(db, "likes"),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(likesQuery);

        const likesMap = new Map<string, string[]>();

        querySnapshot.docs.forEach((doc) => {
          const like = doc.data() as LikedPhoto;
          const photos = likesMap.get(like.userId) || [];
          photos.push(like.photoId);
          likesMap.set(like.userId, photos);
        });

        // Fetch user data from Firestore users collection
        const userLikesArray = await Promise.all(
          Array.from(likesMap.entries()).map(async ([userId, photos]) => {
            try {
              const userDoc = await getDoc(doc(db, "users", userId));
              const userData = userDoc.data();
              return {
                userId,
                userName: userData?.displayName || userId,
                photos,
              };
            } catch (error) {
              console.error(`Error fetching user data for ${userId}:`, error);
              return {
                userId,
                userName: userId,
                photos,
              };
            }
          })
        );

        setUserLikes(userLikesArray);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching likes:", error);
        setLoading(false);
      }
    };

    fetchLikes();
  }, [user]);

  const handlePhotoClick = (photoId: string) => {
    const isLiked = userLikes.some(
      (ul) => ul.userId === user.uid && ul.photos.includes(photoId)
    );
    setSelectedPhoto({
      filename: photoId,
      path: `/out/${photoId}`,
      liked: isLiked,
    });
  };

  const toggleLike = async (photo: Photo) => {
    if (!user) return;

    const likeRef = doc(db, "likes", `${user.uid}_${photo.filename}`);

    if (!photo.liked) {
      await setDoc(likeRef, {
        userId: user.uid,
        photoId: photo.filename,
        timestamp: Date.now(),
      });

      // Update local state
      setUserLikes((prevLikes) => {
        const userLike = prevLikes.find((ul) => ul.userId === user.uid);
        if (userLike) {
          return prevLikes.map((ul) =>
            ul.userId === user.uid
              ? { ...ul, photos: [...ul.photos, photo.filename] }
              : ul
          );
        } else {
          return [
            ...prevLikes,
            {
              userId: user.uid,
              userName: user.displayName || user.uid,
              photos: [photo.filename],
            },
          ];
        }
      });
    } else {
      await deleteDoc(likeRef);

      // Update local state
      setUserLikes((prevLikes) =>
        prevLikes
          .map((ul) =>
            ul.userId === user.uid
              ? {
                  ...ul,
                  photos: ul.photos.filter((id) => id !== photo.filename),
                }
              : ul
          )
          .filter((ul) => ul.photos.length > 0)
      );
    }

    if (selectedPhoto && selectedPhoto.filename === photo.filename) {
      setSelectedPhoto({ ...selectedPhoto, liked: !selectedPhoto.liked });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Liked Photos</h1>
      <div className="space-y-4">
        {userLikes.map((userLike) => (
          <div
            key={userLike.userId}
            className="border rounded-lg overflow-hidden"
          >
            <button
              className="w-full px-4 py-2 text-left bg-gray-800 hover:bg-gray-900 transition-colors"
              onClick={() =>
                setExpandedUser(
                  expandedUser === userLike.userId ? null : userLike.userId
                )
              }
            >
              <span className="font-semibold">{userLike.userName}</span>
              <span className="text-gray-100 ml-2">
                ({userLike.photos.length} photos)
              </span>
            </button>
            {expandedUser === userLike.userId && (
              <div className="p-4 columns-2 md:columns-3 lg:columns-4 gap-4">
                {userLike.photos.map((photoId) => (
                  <div key={photoId} className="mb-4 break-inside-avoid">
                    <img
                      src={`/out/${photoId}`}
                      alt={`Photo ${photoId}`}
                      className="w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handlePhotoClick(photoId)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onToggleLike={toggleLike}
        />
      )}
    </div>
  );
}
