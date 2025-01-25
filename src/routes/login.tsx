import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase";
import { route } from "preact-router";
import { doc, setDoc } from "firebase/firestore";

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Save user data to Firestore
      const userRef = doc(db, "users", result.user.uid);
      await setDoc(
        userRef,
        {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );

      route("/");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8 bg-gray-700 rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-200">
          Login to explore Santosh and Prasanna's Wedding Gallery
        </h1>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
        >
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
};
export default Login;
