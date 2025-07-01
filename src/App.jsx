import { Routes, Route } from "react-router-dom";

import { Navbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Dashboard from "./pages/Dashboard";
import Statements from "./pages/Statements";

function App() {
  return (
    <div width="100%">
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
              <LinkContainer to="/categories">
                <Nav.Link>Categories</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/subcategories">
                <Nav.Link>Subcategories</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/keywords">
                <Nav.Link>Keywords</Nav.Link>
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/statements" element={<Statements />} />
      </Routes>
    </div>
  );
}

export default App;
