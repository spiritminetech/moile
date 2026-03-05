import React, { useEffect, useState } from "react";
import { Card, Spin, Alert, Image } from "antd";
import axios from "axios";

const BossProgressReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ⚠️ Backend base URL
const API_URL = process.env.REACT_APP_URL;

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  // ✅ Resolve image URLs correctly
  const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads")) return `${API_URL.replace("/api", "")}${path}`;
  return `${API_URL.replace("/api", "")}/uploads/${path}`;
};


  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_URL}/boss/progress-reports`, {
        params: { date: today } // only date, backend ignores companyId
      });

      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Progress report fetch error:", err);
      setError("Failed to load progress reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []); // no companyId dependency anymore

  if (loading) return <Spin size="large" className="m-6" />;
  if (error) return <Alert type="error" message={error} className="m-6" />;

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <h1 className="text-lg font-bold mb-4">Progress Reports – {today}</h1>

      {reports.length === 0 && (
        <Alert
          type="info"
          message="No progress reports available for today"
          className="mb-4"
        />
      )}

      {reports.map((report) => (
        <Card
          key={report.projectId}
          title={report.projectName}
          className="mb-4 shadow-sm"
        >
          <p>
            <strong>Progress:</strong> {report.progress}%
          </p>
          <p>
            <strong>Remarks:</strong> {report.remarks || "No remarks"}
          </p>
          {report.issues && (
            <p>
              <strong>Issues:</strong> {report.issues}
            </p>
          )}
          {Array.isArray(report.photos) && report.photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {report.photos.map((photo, idx) => (
                <Image
                  key={idx}
                  src={getPhotoUrl(photo)}
                  width={120}
                  height={120}
                  style={{ objectFit: "cover" }}
                  preview={{ mask: "Preview" }}
                />
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default BossProgressReports;
