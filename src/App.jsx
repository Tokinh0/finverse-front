import { Routes, Route } from "react-router-dom";

import AppNavbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Statements from "./pages/Statements";
import CategorySubcategoryManager from "./pages/CategorySubcategoryManager";
import MonthlyByCategory from "./pages/reports/MonthlyByCategory";
import MonthlyBySubcategory from "./pages/reports/MonthlyBySubcategory";
import { useState } from "react";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import { API_BASE_URL } from "./constants/env";
import KeywordsCrud from "./pages/KeywordsCrud";

function App() {
  return (
    <div>
      <AppNavbar />
      <br />
      <br />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/statements" element={<Statements />} />
        <Route path="/categories&subcategories" element={<CategorySubcategoryManager />} />
        <Route path="/reports/monthly-by-category" element={<MonthlyByCategory />} />
        <Route path="/reports/monthly-by-subcategory" element={<MonthlyBySubcategory />} />
        <Route path="/keywords" element={<KeywordsCrud/>} />
        <Route path="/assets" element={<PortfolioDashboard/>} />
      </Routes>
    </div>
  );
}

export default App;
