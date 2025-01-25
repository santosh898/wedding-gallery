import { useState, useEffect } from "preact/hooks";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { route } from "preact-router";

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

        const userLikesArray = Array.from(likesMap.entries()).map(
          ([userId, photos]) => ({
            userId,
            userName: userId, // In a real app, you'd fetch the user's display name
            photos,
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
              className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() =>
                setExpandedUser(
                  expandedUser === userLike.userId ? null : userLike.userId
                )
              }
            >
              <span className="font-semibold">{userLike.userName}</span>
              <span className="text-gray-600 ml-2">
                ({userLike.photos.length} photos)
              </span>
            </button>
            {expandedUser === userLike.userId && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userLike.photos.map((photoId) => (
                  <div key={photoId} className="aspect-square">
                    <img
                      src={`/out/${photoId}`}
                      alt={`Photo ${photoId}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
