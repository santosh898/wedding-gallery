import { Router, Route, route } from "preact-router";
import { Home } from "./routes/home";
import Likes from "./routes/likes";
import Login from "./routes/login";
import { useState, useEffect } from "preact/hooks";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = () => {
    auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <>
      {user && (
        <div className="flex items-center justify-between p-4 bg-gray-700 shadow-sm">
          <h4 className="text-xl font-semibold text-gray-200">
            Welcome {user.displayName}!
          </h4>
          <div className="space-x-4">
            <button
              onClick={() => route("/likes")}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-gray-100 transition-colors cursor-pointer"
            >
              Explore Likes
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      )}
      <Router>
        <Route path="/" component={Home} user={user} />
        <Route path="/likes" component={Likes} user={user} />
        <Route path="/login" component={Login} />
      </Router>
    </>
  );
}
