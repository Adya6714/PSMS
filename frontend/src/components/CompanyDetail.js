// src/components/CompanyDetail.js

import React, { useState, useEffect } from "react";
import axios from "axios";

function CompanyDetail({ companyName }) {
  const [companyData, setCompanyData] = useState(null);
  const [message, setMessage] = useState("");

  // Local state for ratings & checkbox & remarks, so we can control inputs
  const [ratingCompany, setRatingCompany] = useState("");
  const [ratingLocation, setRatingLocation] = useState("");
  const [ratingStipend, setRatingStipend] = useState("");
  const [projectRatings, setProjectRatings] = useState([]); // Array of {name, rating}
  const [reachedLinkedIn, setReachedLinkedIn] = useState(false);
  const [remarks, setRemarks] = useState("");

  // Fetch the company details whenever companyName changes
  const fetchDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/company/${companyName}`);
      const data = res.data.company;
      setCompanyData(data);

      // Initialize local state from fetched data
      setRatingCompany(data.rating_company_overall ?? "");
      setRatingLocation(data.rating_location ?? "");
      setRatingStipend(data.rating_stipend ?? "");
      setReachedLinkedIn(data.reached_linkedin || false);
      setRemarks(data.remarks || "");

      // Map project ratings into an array
      const projs = (data.projects || []).map((p) => ({
        name: p.name,
        rating: p.rating ?? ""
      }));
      setProjectRatings(projs);

    } catch (err) {
      console.error("Error fetching company details:", err);
      setMessage("Error loading company data.");
    }
  };

  useEffect(() => {
    if (companyName) {
      fetchDetails();
    }
  }, [companyName]);

  // Called whenever any rating/checkbox/remark changes
  const handleSave = async () => {
    // Prepare payload
    const payload = {
      rating_company_overall: ratingCompany ? parseInt(ratingCompany) : null,
      rating_location: ratingLocation ? parseInt(ratingLocation) : null,
      rating_stipend: ratingStipend ? parseInt(ratingStipend) : null,
      reached_linkedin: reachedLinkedIn,
      remarks: remarks,
      project_ratings: projectRatings.map((p) => ({
        name: p.name,
        rating: p.rating ? parseInt(p.rating) : null
      }))
    };

    try {
      const res = await axios.post(
        `http://localhost:5001/company/${companyName}/update`,
        payload
      );
      setMessage("Saved successfully!");
      // Optionally re-fetch to ensure data is up to date
      fetchDetails();
    } catch (err) {
      console.error("Error saving:", err);
      setMessage(err.response?.data?.error || "Error saving data.");
    }
  };

  // Handler for when a project rating changes
  const handleProjectRatingChange = (projName, newRating) => {
    const updated = projectRatings.map((p) =>
      p.name === projName ? { ...p, rating: newRating } : p
    );
    setProjectRatings(updated);
  };

  if (!companyData) {
    return <p>Loading company data...</p>;
  }

  return (
    <div>
      <h2 className="company-header">{companyData.company}</h2>
      <div className="company-info">
        <p><strong>Location:</strong> {companyData.location}</p>
        <p><strong>Business Domain:</strong> {companyData.business_domain}</p>
        <p><strong>Tags:</strong> {companyData.tags.join(", ")}</p>
        <p><strong>Stipend:</strong> ₹{companyData.stipend}</p>
      </div>

      <div>
        <h3>Rate This Company</h3>
        <div>
          <label>
            Company Overall (1–5):{" "}
            <select value={ratingCompany} onChange={(e) => setRatingCompany(e.target.value)}>
              <option value="">—</option>
              {[1,2,3,4,5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Location (1–5):{" "}
            <select value={ratingLocation} onChange={(e) => setRatingLocation(e.target.value)}>
              <option value="">—</option>
              {[1,2,3,4,5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Stipend (1–5):{" "}
            <select value={ratingStipend} onChange={(e) => setRatingStipend(e.target.value)}>
              <option value="">—</option>
              {[1,2,3,4,5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <h3>Rate Projects</h3>
        {projectRatings.map((proj) => (
          <div key={proj.name} className="project-item">
            <label>
              {proj.name}:{" "}
              <select
                value={proj.rating}
                onChange={(e) => handleProjectRatingChange(proj.name, e.target.value)}
              >
                <option value="">—</option>
                {[1,2,3,4,5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
        ))}

        <div>
          <label>
            <input
              type="checkbox"
              checked={reachedLinkedIn}
              onChange={(e) => setReachedLinkedIn(e.target.checked)}
            />{" "}
            Reached via LinkedIn
          </label>
        </div>

        <div>
          <label>
            Remarks: <br />
            <textarea
              rows="3"
              cols="50"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </label>
        </div>

        <button onClick={handleSave}>Save</button>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default CompanyDetail;