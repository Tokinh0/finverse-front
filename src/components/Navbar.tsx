import { Badge, Container, Form, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import { isRunActive, useSuggestionsSummary } from "../hooks/suggestionsSummary";
import { useI18n } from "../i18n/context";

interface Props {
  showTotals: boolean;
  setShowTotals: (value: boolean) => void;
}

const LINKS = [
  { to: "/", key: "dashboard" },
  { to: "/statements", key: "statements" },
  { to: "/transactions", key: "transactions" },
  { to: "/alerts", key: "reviewCharges" },
  { to: "/categories&subcategories", key: "categories" },
  { to: "/keywords", key: "keywords" },
  { to: "/assets", key: "assets" },
] as const;
export default function AppNavbar({ showTotals, setShowTotals }: Props) {
  const { summary } = useSuggestionsSummary();
  const { t } = useI18n();
  const pending = summary?.pending_count ?? 0;

  return (
    <Navbar bg="dark" variant="dark" expand="md" className="mb-4" fixed="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Finverse
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto">
            {LINKS.map(({ to, key }) => (
              <Nav.Link key={to} as={NavLink} to={to} end>
                {t.nav[key]}
              </Nav.Link>
            ))}
            <Nav.Link as={NavLink} to="/suggestions" end>
              {t.nav.suggestions}
              {pending > 0 && (
                <Badge bg="warning" text="dark" pill className="ms-1" data-testid="suggestions-badge">
                  {pending}
                  <span className="visually-hidden">{t.nav.toReview}</span>
                </Badge>
              )}
              {isRunActive(summary) && (
                <span className="ms-1 small" title={t.nav.generating}>
                  ⟳<span className="visually-hidden"> {t.nav.generating}</span>
                </span>
              )}
            </Nav.Link>
            <NavDropdown title={t.nav.reports} id="reports-dropdown">
              <NavDropdown.Item as={Link} to="/reports/financial-health">
                {t.nav.financialHealth}
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reports/monthly-by-category">
                {t.nav.monthlyByCategory}
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reports/monthly-by-subcategory">
                {t.nav.monthlyBySubcategory}
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Nav>
            <Nav.Link as={NavLink} to="/settings" end aria-label={t.nav.settings} title={t.nav.settings}>
              ⚙
            </Nav.Link>
          </Nav>
          <Form className="d-flex ms-2 align-items-center">
            <Form.Check
              type="switch"
              id="toggle-totals"
              checked={showTotals}
              onChange={(e) => setShowTotals(e.target.checked)}
              label={<span title={t.nav.toggleTotals}>{showTotals ? "👁️" : "🙈"}</span>}
              aria-label={t.nav.showTotals}
              style={{ color: "white" }}
            />
          </Form>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
