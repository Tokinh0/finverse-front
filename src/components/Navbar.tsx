import { Container, Form, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";

interface Props {
  showTotals: boolean;
  setShowTotals: (value: boolean) => void;
}

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/statements", label: "Statements" },
  { to: "/categories&subcategories", label: "Categories & Subcategories" },
  { to: "/keywords", label: "Keywords" },
  { to: "/assets", label: "Assets" },
];

export default function AppNavbar({ showTotals, setShowTotals }: Props) {
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
            <NavDropdown title="Reports" id="reports-dropdown">
              <NavDropdown.Item as={Link} to="/reports/monthly-by-category">
                Monthly by Category
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reports/monthly-by-subcategory">
                Monthly by Subcategory
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Form className="d-flex ms-auto align-items-center">
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
