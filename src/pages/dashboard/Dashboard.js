import React from "react";
import { Row, Col, Table, Badge, Progress } from "reactstrap";
import Widget from "../../components/Widget";
import { fetchAnalyses, fetchOpenAiUsageMetrics, getStoredUser } from "../../api";
import s from "./Dashboard.module.scss";

function Dashboard() {
  const [analyses, setAnalyses] = React.useState([]);
  const [usageMetrics, setUsageMetrics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    const currentUser = getStoredUser();
    const isSuperAdmin = currentUser && currentUser.role === "super-admin";

    Promise.allSettled([
      fetchAnalyses(),
      isSuperAdmin ? fetchOpenAiUsageMetrics({ days: 30 }) : Promise.resolve(null)
    ])
      .then(([analysesResult, metricsResult]) => {
        if (!active) return;

        if (analysesResult.status === "fulfilled") {
          setAnalyses(analysesResult.value);
        } else {
          setError(analysesResult.reason.message);
        }

        if (metricsResult && metricsResult.status === "fulfilled") {
          setUsageMetrics(metricsResult.value);
        }

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

  const highMatches = analyses.filter((item) => item.suitabilityScore >= 85).length;
  const partnerCount = new Set(
    analyses.flatMap((item) => (item.targetPartners || []).map((partner) => partner._id || partner))
  ).size;
  const estimatedAiSpendFromAnalyses = analyses.reduce(
    (sum, item) => sum + (((item.aiUsage && item.aiUsage.estimatedCostUsd) || 0)),
    0
  );
  const totalAiSpend = usageMetrics && usageMetrics.totals
    ? Number(usageMetrics.totals.costUsd || 0)
    : estimatedAiSpendFromAnalyses;
  const countryMap = analyses.reduce((acc, item) => {
    (item.preferredCountries || []).forEach((country) => {
      const name = country.name || "Unknown";
      if (!acc[name]) {
        acc[name] = { name, applications: 0 };
      }
      acc[name].applications += 1;
    });
    return acc;
  }, {});
  const pipelineByCountry = Object.values(countryMap);
  const recommendationBoard = analyses
    .flatMap((item) => item.recommendedInstitutions || [])
    .filter((item) => item && (item.institution || item.institutionName))
    .slice(0, 3);

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 4 : 2
    }).format(value || 0);
  }

  const dashboardStats = [
    { title: "CVs Reviewed", value: analyses.length },
    { title: "High Match Profiles", value: highMatches },
    { title: "Partner Institutions", value: partnerCount },
    { title: usageMetrics ? "OpenAI Panel Spend" : "Estimated AI Spend", value: formatCurrency(totalAiSpend) }
  ];

  return (
    <div className={s.root}>
      <div className={s.hero}>
        <div>
          <h1 className="page-title mb-1">Student Migration CV Analyzer</h1>
          <p className={s.subtitle}>
            Review student CVs, rank degree suitability, and match each applicant with the right country, partner, university, and cost range.
          </p>
          {/* {usageMetrics && usageMetrics.filters && usageMetrics.filters.projectId && (
            <div className={s.metricsHint}>
              Live OpenAI usage scoped to project <strong>{usageMetrics.filters.projectId}</strong>
            </div>
          )} */}
        </div>
      </div>

      <Row>
        {dashboardStats.map((item) => (
          <Col lg={3} sm={6} xs={12} key={item.title}>
            <Widget className={s.statCard}>
              <div className={s.statLabel}>{item.title}</div>
              <div className={s.statValue}>{item.value}</div>
            </Widget>
          </Col>
        ))}
      </Row>

      <Row>
        <Col lg={8}>
          <Widget title={<h5 className="mb-0">Latest CV Ranking Results</h5>}>
            <div className={s.tableWrap}>
              {loading && <div className={s.emptyState}>Loading real analysis data...</div>}
              {!loading && error && <div className={s.emptyState}>{error}</div>}
              {!loading && !error && analyses.length === 0 && (
                <div className={s.emptyState}>No CV analysis data found yet.</div>
              )}
              {!loading && !error && analyses.length > 0 && (
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Degree</th>
                      <th>Countries</th>
                      <th>Top Institution</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.slice(0, 6).map((analysis) => {
                      const top = analysis.recommendedInstitutions && analysis.recommendedInstitutions[0];
                      return (
                        <tr key={analysis._id}>
                          <td>
                            <strong>{analysis.studentName}</strong>
                            <div className={s.muted}>{analysis.email || "No email"}</div>
                          </td>
                          <td>{analysis.desiredDegree}</td>
                          <td>{(analysis.preferredCountries || []).map((country) => country.name).join(", ") || "Not selected"}</td>
                          <td>{(top && ((top.institution && top.institution.name) || top.institutionName)) || "No recommendation yet"}</td>
                          <td>
                            <Badge color={analysis.suitabilityScore >= 85 ? "success" : "warning"}>
                              {analysis.suitabilityScore || 0}%
                            </Badge>
                          </td>
                          <td>{analysis.analysisStatus}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </div>
          </Widget>
        </Col>
        <Col lg={4}>
          <Widget title={<h5 className="mb-0">Analysis Accuracy Controls</h5>}>
            <div className={s.panelBlock}>
              <div className={s.panelRow}>
                <span>Academic weighting</span>
                <strong>40%</strong>
              </div>
              <Progress value={40} color="danger" className="progress-xs mb-3" />
              <div className={s.panelRow}>
                <span>English weighting</span>
                <strong>20%</strong>
              </div>
              <Progress value={20} color="primary" className="progress-xs mb-3" />
              <div className={s.panelRow}>
                <span>Budget weighting</span>
                <strong>20%</strong>
              </div>
              <Progress value={20} color="warning" className="progress-xs mb-3" />
              <div className={s.panelRow}>
                <span>Degree-country fit</span>
                <strong>20%</strong>
              </div>
              <Progress value={20} color="success" className="progress-xs" />
            </div>
          </Widget>
        </Col>
      </Row>

      <Row>
        <Col lg={5}>
          <Widget title={<h5 className="mb-0">Country Pipeline</h5>}>
            {pipelineByCountry.length === 0 && <div className={s.emptyState}>No country pipeline data yet.</div>}
            {pipelineByCountry.map((country) => (
              <div key={country.name} className={s.pipelineCard}>
                <div>
                  <strong>{country.name}</strong>
                  <div className={s.muted}>Live data from submitted analyses</div>
                </div>
                <div className="text-right">
                  <div>{country.applications} applications</div>
                </div>
              </div>
            ))}
          </Widget>
        </Col>
        <Col lg={7}>
          <Widget title={<h5 className="mb-0">Top Recommended Institutions</h5>}>
            {recommendationBoard.length === 0 && <div className={s.emptyState}>No recommendations yet.</div>}
            <Row>
              {recommendationBoard.map((item, index) => (
                <Col md={4} key={`${(item.institution && item.institution._id) || item.institutionName || index}`}>
                  <div className={s.recommendationCard}>
                    <Badge color="danger" pill>{item.fitScore || 0}% fit</Badge>
                    <h6 className="mt-3 mb-1">{(item.institution && item.institution.name) || item.institutionName}</h6>
                    <div className={s.muted}>
                      {(item.institution && item.institution.country && item.institution.country.name) || item.countryName || "Unknown country"}
                    </div>
                    <div className={s.costLine}>Annual cost ${item.annualCost || 0}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Widget>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
