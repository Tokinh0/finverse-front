import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import ChargeAlerts from "./pages/ChargeAlerts";
import CategorySubcategoryManager from "./pages/CategorySubcategoryManager";
import Dashboard from "./pages/Dashboard";
import KeywordsCrud from "./pages/KeywordsCrud";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import Statements from "./pages/Statements";
import Transactions from "./pages/Transactions";
import MonthlyByCategory from "./pages/reports/MonthlyByCategory";
import MonthlyBySubcategory from "./pages/reports/MonthlyBySubcategory";

export default function App() {
  // Global privacy toggle: when false, amounts are hidden on reports and the portfolio.
  const [showTotals, setShowTotals] = useState(false);

  return (
    <div>
      <AppNavbar showTotals={showTotals} setShowTotals={setShowTotals} />
      <br />
      <br />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/statements" element={<Statements />} />
        <Route path="/transactions" element={<Transactions showTotals={showTotals} />} />
        <Route path="/alerts" element={<ChargeAlerts showTotals={showTotals} />} />
        <Route path="/categories&subcategories" element={<CategorySubcategoryManager />} />
        <Route path="/keywords" element={<KeywordsCrud />} />
        <Route path="/reports/monthly-by-category" element={<MonthlyByCategory />} />
        <Route path="/reports/monthly-by-subcategory" element={<MonthlyBySubcategory showTotals={showTotals} />} />
        <Route path="/assets" element={<PortfolioDashboard showTotals={showTotals} />} />
      </Routes>
    </div>
  );
}
