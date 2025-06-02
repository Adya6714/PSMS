// src/App.js

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import FileUpload from "./components/FileUpload";
import CompanyDetail from "./components/CompanyDetail";
import Ranking from "./components/Ranking";
import "./App.css";

function App() {
  // List of all company names for sidebar
  const [companyList, setCompanyList] = useState([]);
  // currently selected company name
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Fetch the company names when the app loads or after upload
  const fetchCompanies = async () => {
    try {
      const res = await axios.get("http://localhost:5001/companies");
      setCompanyList(res.data.companies || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  // useEffect runs once when component mounts
  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar always visible */}
        <Sidebar
          companies={companyList}
          onSelectCompany={(name) => setSelectedCompany(name)}
        />

        <div className="main-content">
          {/* FileUpload is always at top, so user can re-upload if needed */}
          <FileUpload onUploadSuccess={fetchCompanies} />

          {/* Navigation links for "Detail View" and "Ranking" */}
          <nav className="nav-tabs">
            <NavLink to="/" end className={({ isActive }) => isActive ? "active-tab" : ""}>
              Detail View
            </NavLink>
            <NavLink to="/ranking" className={({ isActive }) => isActive ? "active-tab" : ""}>
              Ranking
            </NavLink>
          </nav>

          <Routes>
            <Route
              path="/"
              element={
                selectedCompany ? (
                  <CompanyDetail companyName={selectedCompany} />
                ) : (
                  <p>Please select a company from the sidebar.</p>
                )
              }
            />
            <Route path="/ranking" element={<Ranking />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;