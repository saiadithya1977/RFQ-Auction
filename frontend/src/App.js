import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RFQList from "./pages/RFQList";
import RFQDetails from "./pages/RFQDetails";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Login />} />
        <Route path="/rfqs" element={<RFQList />} />
        <Route path="/rfq/:id" element={<RFQDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;