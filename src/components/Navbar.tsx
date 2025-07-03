import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

const AppNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="md" className="mb-4">
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
              <Nav.Link>Categories&Subcategories</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/keywords">
              <Nav.Link>Keywords</Nav.Link>
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
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
