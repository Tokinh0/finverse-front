import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Loading } from "./components/LoadingState";
import AppNavbar from "./components/Navbar";
import { SuggestionsSummaryContext, useSuggestionsSummaryState } from "./hooks/suggestionsSummary";
import { usePersistentToggle } from "./hooks/usePersistentToggle";
import I18nProvider from "./i18n/I18nProvider";
import Categorization from "./pages/Categorization";
import ChargeAlerts from "./pages/ChargeAlerts";
import Market from "./pages/Market";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import ProfilePicker from "./pages/ProfilePicker";
import Settings from "./pages/Settings";
import Statements from "./pages/Statements";
import Suggestions from "./pages/Suggestions";
import Transactions from "./pages/Transactions";
import FinancialHealth from "./pages/reports/FinancialHealth";
import MonthlyByCategory from "./pages/reports/MonthlyByCategory";
import MonthlyBySubcategory from "./pages/reports/MonthlyBySubcategory";
import ProfileProvider from "./profile/ProfileProvider";
import { useProfile } from "./profile/context";

export default function App() {
  return (
    <I18nProvider>
      <ProfileProvider>
        <AppRoutes />
      </ProfileProvider>
    </I18nProvider>
  );
}

function AppRoutes() {
  // Global privacy toggle: when false, amounts are hidden. Saved in the browser, and changed
  // only by the switch in the navbar.
  const [showTotals, setShowTotals] = usePersistentToggle("finverse.showTotals", false);
  const { status } = useProfile();

  if (status === "loading") return <Loading />;

  return (
    <Routes>
      {/* Home: the profile picker, or straight to the Market page when already signed in. */}
      <Route path="/" element={status === "signedIn" ? <Navigate to="/market" replace /> : <ProfilePicker />} />
      {/* The Market page used to be the "painel"; keep old links working. */}
      <Route path="/painel" element={<Navigate to="/market" replace />} />
      <Route element={<SignedInLayout showTotals={showTotals} setShowTotals={setShowTotals} />}>
        <Route path="/market" element={<Market showTotals={showTotals} />} />
        <Route path="/statements" element={<Statements />} />
        <Route path="/transactions" element={<Transactions showTotals={showTotals} />} />
        <Route path="/alerts" element={<ChargeAlerts showTotals={showTotals} />} />
        <Route path="/categorization" element={<Categorization />} />
        {/* the two pages it replaced */}
        <Route path="/categories&subcategories" element={<Navigate to="/categorization" replace />} />
        <Route path="/keywords" element={<Navigate to="/categorization?tab=rules" replace />} />
        <Route path="/reports/financial-health" element={<FinancialHealth showTotals={showTotals} />} />
        <Route path="/reports/monthly-by-category" element={<MonthlyByCategory showTotals={showTotals} />} />
        <Route path="/reports/monthly-by-subcategory" element={<MonthlyBySubcategory showTotals={showTotals} />} />
        <Route path="/assets" element={<PortfolioDashboard showTotals={showTotals} />} />
        <Route path="/suggestions" element={<Suggestions showTotals={showTotals} />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Every page but the picker needs a signed-in profile; without one it sends the visitor to the
 * picker and comes back after. Keyed by profile, so switching profiles starts every page (and
 * the suggestions summary) fresh.
 */
function SignedInLayout(props: { showTotals: boolean; setShowTotals: (value: boolean) => void }) {
  const { status, profile } = useProfile();
  const location = useLocation();

  if (status !== "signedIn" || !profile) {
    return <Navigate to="/" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <ProfileArea key={profile.id} {...props} />;
}

function ProfileArea({ showTotals, setShowTotals }: { showTotals: boolean; setShowTotals: (value: boolean) => void }) {
  const suggestions = useSuggestionsSummaryState();

  return (
    <SuggestionsSummaryContext.Provider value={suggestions}>
      <AppNavbar showTotals={showTotals} setShowTotals={setShowTotals} />
      <br />
      <br />
      <Outlet />
    </SuggestionsSummaryContext.Provider>
  );
}
