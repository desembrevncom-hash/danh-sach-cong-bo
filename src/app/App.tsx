import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "./providers";
import CatalogPage from "@/pages/CatalogPage";
import NotFound from "@/pages/NotFound";

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </AppProviders>
);

export default App;
