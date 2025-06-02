import React, { useEffect, useState } from "react";
import axios from "axios";

function Sidebar({ onSelectCompany }) {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5001/companies")
      .then((res) => {
        if (res.data && Array.isArray(res.data.companies)) {
          setCompanies(res.data.companies);
        } else {
          console.error("❌ Unexpected response:", res.data);
          setCompanies([]);
        }
      })
      .catch((err) => {
        console.error("❌ Failed to fetch companies", err);
        setCompanies([]); // fallback to empty array
      });
  }, []);

  return (
    <div style={{ padding: "1rem", borderRight: "1px solid #ccc", width: "200px", height: "100vh", overflowY: "auto" }}>
      <h2>Companies</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {companies.map((company, idx) => (
          <li key={idx} style={{ margin: "0.5rem 0", cursor: "pointer" }} onClick={() => onSelectCompany(company)}>
            {company}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;