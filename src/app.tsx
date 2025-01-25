import Router from "preact-router";
import { Home } from "./routes/Home";
import Likes from "./routes/likes";

import Login from "./routes/login";

export function App() {
  return (
    <>
      <Router>
        <Home path="/" />
        <Likes path="/likes" />
        <Login path="/login" />
      </Router>
    </>
  );
}
