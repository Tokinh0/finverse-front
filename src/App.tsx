import { Route, Routes } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import { SuggestionsSummaryContext, useSuggestionsSummaryState } from "./hooks/suggestionsSummary";
import { usePersistentToggle } from "./hooks/usePersistentToggle";
import I18nProvider from "./i18n/I18nProvider";
import ChargeAlerts from "./pages/ChargeAlerts";
import CategorySubcategoryManager from "./pages/CategorySubcategoryManager";
import Dashboard from "./pages/Dashboard";
import KeywordsCrud from "./pages/KeywordsCrud";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import Settings from "./pages/Settings";
import Statements from "./pages/Statements";
import Suggestions from "./pages/Suggestions";
import Transactions from "./pages/Transactions";
import FinancialHealth from "./pages/reports/FinancialHealth";
import MonthlyByCategory from "./pages/reports/MonthlyByCategory";
import MonthlyBySubcategory from "./pages/reports/MonthlyBySubcategory";

export default function App() {
  return (
    <I18nProvider>
      <AppRoutes />
    </I18nProvider>
  );
}

function AppRoutes() {
  // Global privacy toggle: when false, amounts are hidden. Saved in the browser, and changed
  // only by the switch in the navbar.
  const [showTotals, setShowTotals] = usePersistentToggle("finverse.showTotals", false);
  const suggestions = useSuggestionsSummaryState();

  return (
    <SuggestionsSummaryContext.Provider value={suggestions}>
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
        <Route path="/reports/financial-health" element={<FinancialHealth showTotals={showTotals} />} />
        <Route path="/reports/monthly-by-category" element={<MonthlyByCategory showTotals={showTotals} />} />
        <Route path="/reports/monthly-by-subcategory" element={<MonthlyBySubcategory showTotals={showTotals} />} />
        <Route path="/assets" element={<PortfolioDashboard showTotals={showTotals} />} />
        <Route path="/suggestions" element={<Suggestions showTotals={showTotals} />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </SuggestionsSummaryContext.Provider>
  );
}
