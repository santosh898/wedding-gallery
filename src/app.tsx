import { Router, Route } from "preact-router";
import { Home } from "./routes/home";
import Likes from "./routes/likes";

import Login from "./routes/login";

export function App() {
  return (
    <>
      <Router>
        <Route path="/" component={Home} />
        <Route path="/likes" component={Likes} />
        <Route path="/login" component={Login} />
      </Router>
    </>
  );
}
