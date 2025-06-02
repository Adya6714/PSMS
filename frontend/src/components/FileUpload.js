// src/components/FileUpload.js

import React, { useState } from "react";
import axios from "axios";

function FileUpload({ onUploadSuccess }) {
  const [fileComp, setFileComp] = useState(null);
  const [fileStipend, setFileStipend] = useState(null);
  const [message, setMessage] = useState("");

  const handleCompChange = (e) => {
    setFileComp(e.target.files[0]);
  };

  const handleStipendChange = (e) => {
    setFileStipend(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileComp || !fileStipend) {
      setMessage("Please select both Excel files before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("companies_details", fileComp);
    formData.append("stipend_details", fileStipend);

    try {
      const res = await axios.post("http://localhost:5001/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message || "Upload successful.");
      // Notify parent to re-fetch company list
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Error uploading files.");
    }
  };

  return (
    <div>
      <h2>Upload Excel Files</h2>
      <form onSubmit={handleUpload}>
        <div>
          <label>
            company details:{" "}
            <input type="file" accept=".xls,.xlsx" onChange={handleCompChange} />
          </label>
        </div>
        <div>
          <label>
            stipend details:{" "}
            <input type="file" accept=".xls,.xlsx" onChange={handleStipendChange} />
          </label>
        </div>
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default FileUpload;