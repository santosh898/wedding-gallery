import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { route } from 'preact-router';

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      route('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Wedding Photo Gallery</h1>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
        >
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}
export default Login;
