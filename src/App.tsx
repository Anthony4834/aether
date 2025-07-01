import { useState } from "react";
import "./App.css";
import CircleWithLines from "./components/circle";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <CircleWithLines />
    </>
  );
}

export default App;
