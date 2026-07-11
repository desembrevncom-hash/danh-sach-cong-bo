import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { AppProviders } from "./providers";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import NotFound from "@/pages/NotFound";

import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import { PublicLayout } from "@/features/public-layout/components/PublicLayout";

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout><Outlet /></PublicLayout>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/:brandId" element={<CatalogPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  </AppProviders>
);

export default App;
