import React from "react";
import { Row, Col, Table, Badge, Button } from "reactstrap";
import { Link } from "react-router-dom";
import Widget from "../../../components/Widget";
import { fetchAnalyses } from "../../../api";
import s from "./Static.module.scss";

function getTopMatch(analysis) {
  const top = analysis.recommendedInstitutions && analysis.recommendedInstitutions[0];

  if (!top) {
    return "No recommendation yet";
  }

  return (top.institution && top.institution.name) || top.institutionName || "No recommendation yet";
}

function StaticTables() {
  const [analyses, setAnalyses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    fetchAnalyses()
      .then((data) => {
        if (!active) return;
        setAnalyses(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className={s.header}>
        <div>
          <h1 className="page-title mb-1">CV Analysis Queue</h1>
          <p className={s.subtitle}>
            Workers upload student CVs, and the super admin reviews the recommended institutions and cost summary when needed.
          </p>
        </div>
        <Button color="danger" tag={Link} to="/app/main/analyzer">Submit CV for Analysis</Button>
      </div>

      <Row>
        <Col xs={12}>
          <Widget title={<h5 className="mb-0">Open and Completed Analyses</h5>}>
            <div className={s.tableOverflow}>
              {loading && <div className={s.emptyState}>Loading real analysis queue...</div>}
              {!loading && error && <div className={s.emptyState}>{error}</div>}
              {!loading && !error && analyses.length === 0 && <div className={s.emptyState}>No CV analyses submitted yet.</div>}
              {!loading && !error && analyses.length > 0 && (
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Student</th>
                      <th>Preferred Route</th>
                      <th>Top Match</th>
                      <th>Score</th>
                      <th>Visa Chance</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((analysis) => (
                      <tr key={analysis._id}>
                        <td>{analysis._id.slice(-6).toUpperCase()}</td>
                        <td>{analysis.studentName}</td>
                        <td>{(analysis.preferredCountries || []).map((country) => country.name).join(", ") || "Not selected"}</td>
                        <td>{getTopMatch(analysis)}</td>
                        <td><Badge color="success">{analysis.suitabilityScore || 0}%</Badge></td>
                        <td>{analysis.visaChance}</td>
                        <td>{analysis.analysisStatus}</td>
                        <td>
                          <Link
                            to={`/app/main/analyzer/${analysis._id}`}
                            className={s.viewButton}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Widget>
        </Col>
      </Row>
    </div>
  );
}

export default StaticTables;
