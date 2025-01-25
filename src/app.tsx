import { Router, Route } from "preact-router";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Router>
        <Route path="/" component={Home} user={user} />
        <Route path="/likes" component={Likes} user={user} />
        <Route path="/login" component={Login} />
      </Router>
    </>
  );
}
