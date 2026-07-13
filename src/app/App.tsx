import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "./providers";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import NotFound from "@/pages/NotFound";

import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:brandId" element={<CatalogPage />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </AppProviders>
);

export default App;
