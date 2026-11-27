import { Badge, Container, Form, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import { isRunActive, useSuggestionsSummary } from "../hooks/suggestionsSummary";

interface Props {
  showTotals: boolean;
  setShowTotals: (value: boolean) => void;
}

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/statements", label: "Statements" },
  { to: "/transactions", label: "Transactions" },
  { to: "/alerts", label: "Review charges" },
  { to: "/categories&subcategories", label: "Categories & Subcategories" },
  { to: "/keywords", label: "Keywords" },
  { to: "/assets", label: "Assets" },
];

export default function AppNavbar({ showTotals, setShowTotals }: Props) {
  const { summary } = useSuggestionsSummary();
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
            {LINKS.map(({ to, label }) => (
              <Nav.Link key={to} as={NavLink} to={to} end>
                {label}
              </Nav.Link>
            ))}
            <Nav.Link as={NavLink} to="/suggestions" end>
              Suggestions
              {pending > 0 && (
                <Badge bg="warning" text="dark" pill className="ms-1" data-testid="suggestions-badge">
                  {pending}
                  <span className="visually-hidden"> to review</span>
                </Badge>
              )}
              {isRunActive(summary) && (
                <span className="ms-1 small" title="Generating suggestions">
                  ⟳<span className="visually-hidden"> generating</span>
                </span>
              )}
            </Nav.Link>
            <NavDropdown title="Reports" id="reports-dropdown">
              <NavDropdown.Item as={Link} to="/reports/financial-health">
                Financial health
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reports/monthly-by-category">
                Monthly by Category
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reports/monthly-by-subcategory">
                Monthly by Subcategory
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Nav>
            <Nav.Link as={NavLink} to="/settings" end aria-label="Settings" title="Settings">
              ⚙
            </Nav.Link>
          </Nav>
          <Form className="d-flex ms-2 align-items-center">
            <Form.Check
              type="switch"
              id="toggle-totals"
              checked={showTotals}
              onChange={(e) => setShowTotals(e.target.checked)}
              label={<span title="Toggle totals view">{showTotals ? "👁️" : "🙈"}</span>}
              aria-label="Show totals"
              style={{ color: "white" }}
            />
          </Form>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
