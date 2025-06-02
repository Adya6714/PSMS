// src/components/Ranking.js

import React, { useState, useEffect } from "react";
import axios from "axios";

function Ranking() {
  const [rankingData, setRankingData] = useState([]);
  const [message, setMessage] = useState("");

  const fetchRanking = async () => {
    try {
      const res = await axios.get("http://localhost:5001/ranking");
      setRankingData(res.data.ranking || []);
    } catch (err) {
      console.error("Error fetching ranking:", err);
      setMessage("Error loading ranking.");
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  return (
    <div>
      <h2>Company Rankings</h2>
      {message && <p>{message}</p>}
      {rankingData.length === 0 ? (
        <p>No data to display.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Company Name</th>
              <th>Location</th>
              <th>Stipend</th>
              <th>Average Score</th>
            </tr>
          </thead>
          <tbody>
            {rankingData.map((item, idx) => (
              <tr key={item.company}>
                <td>{idx + 1}</td>
                <td>{item.company}</td>
                <td>{item.location}</td>
                <td>₹{item.stipend}</td>
                <td>{item.average_score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Ranking;