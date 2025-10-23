import { Navbar, Container, Nav, NavDropdown, Form } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setShowTotals, toggleShowTotals } from "../store/uiSlice";

const AppNavbar = () => {
  const dispatch = useAppDispatch();
  const showTotals = useAppSelector((s) => s.ui.showTotals);
  return (
    <Navbar bg="dark" variant="dark" expand="md" className="mb-4" fixed="top">
      <Container>
        <Navbar.Brand href="/">Finverse</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/statements">
              <Nav.Link>Statements</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/categories&subcategories">
              <Nav.Link>Categories & Subcategories</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/keywords">
              <Nav.Link>Keywords</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/assets">
              <Nav.Link>Assets</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/goals">
              <Nav.Link>Goals</Nav.Link>
            </LinkContainer>
            <NavDropdown title="Reports" id="reports-dropdown">
              <LinkContainer to="/reports/monthly-by-category">
                <NavDropdown.Item>Monthly by Category</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/reports/monthly-by-subcategory">
                <NavDropdown.Item>Monthly by Subcategory</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>
          </Nav>
          <Form className="d-flex ms-auto align-items-center">
            <Form.Check
              type="switch"
              id="show-totals-switch"
              checked={showTotals}
              onChange={() => dispatch(toggleShowTotals())}
              label={<span title="Toggle totals view">{showTotals ? '👁️' : '🙈'}</span>}
              style={{ color: "white" }}
            />
          </Form>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
