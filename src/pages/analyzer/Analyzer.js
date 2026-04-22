import React from "react";
import { Link } from "react-router-dom";
import { Row, Col, Badge, Button, Form, FormGroup, Label, Input } from "reactstrap";
import Widget from "../../components/Widget";
import { createAnalysisRequest, fetchAnalysisById, fetchCountries } from "../../api";
import s from "./Analyzer.module.scss";

const initialForm = {
  studentName: "",
  email: "",
  age: "",
  maritalStatus: "single",
  partnerAustralianStatus: "not-applicable",
  targetStudyGoal: "",
  desiredDegree: "master",
  academicScore: "",
  englishTestType: "ielts",
  englishScore: "",
  budget: "",
  preferredCountries: [],
  cvText: "",
  studentQuestion: ""
};

function CustomSelect({
  id,
  name,
  value,
  options,
  onChange,
  placeholder
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const selectedOption = options.find((item) => item.value === value) || null;

  React.useEffect(() => {
    function handleOutsideClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSelect(nextValue) {
    onChange({
      target: {
        name,
        value: nextValue
      }
    });

    setOpen(false);
  }

  return (
    <div className={s.customSelect} ref={rootRef}>
      <button
        id={id}
        type="button"
        className={`${s.input} ${s.selectTrigger} ${open ? s.selectTriggerOpen : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={s.selectTriggerValue}>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className={s.selectTriggerArrow} aria-hidden="true" />
      </button>

      {open && (
        <div className={s.selectMenu} role="listbox" aria-labelledby={id}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${s.selectOption} ${value === option.value ? s.selectOptionActive : ""}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeCvText(analysis) {
  if (!analysis) {
    return "";
  }

  return String(analysis.extractedCvText || analysis.cvText || "").trim();
}

function buildCvCategories(rawText) {
  const text = String(rawText || "").replace(/\r/g, "").trim();

  if (!text) {
    return [];
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  function cleanLine(line) {
    return line.replace(/^[-*•\u2022]+\s*/, "").trim();
  }

  function isHeadingLike(line) {
    const stripped = line.replace(/[:-]+$/, "").trim();

    if (!stripped || stripped.length > 42) {
      return false;
    }

    const lettersOnly = stripped.replace(/[^A-Za-z\s&/]/g, "").trim();

    if (!lettersOnly) {
      return false;
    }

    return stripped === stripped.toUpperCase() || /^[A-Z][A-Za-z\s&/]+$/.test(stripped);
  }

  const groups = [
    { key: "profile", title: "Profile", matchers: ["profile", "summary", "objective", "about"] },
    { key: "education", title: "Education", matchers: ["education", "qualification", "academic"] },
    { key: "experience", title: "Experience", matchers: ["experience", "employment", "work history", "career history"] },
    { key: "skills", title: "Skills", matchers: ["skills", "technical skills", "tech stack", "competencies"] },
    { key: "projects", title: "Projects", matchers: ["projects", "project experience", "portfolio"] },
    { key: "certifications", title: "Certifications", matchers: ["certifications", "certificates", "licenses"] },
    { key: "languages", title: "Languages", matchers: ["languages", "language"] }
  ];

  const buckets = {};
  groups.forEach((group) => {
    buckets[group.key] = [];
  });
  buckets.other = [];

  let currentGroup = "profile";
  let lastItemIndex = -1;

  lines.forEach((line) => {
    const normalized = line.replace(/[:-]+$/, "").toLowerCase();
    const foundGroup = groups.find((group) =>
      group.matchers.some((matcher) => normalized === matcher || normalized.startsWith(matcher))
    );

    if (foundGroup) {
      currentGroup = foundGroup.key;
      lastItemIndex = -1;
      return;
    }

    const itemText = cleanLine(line);

    if (isHeadingLike(line) && buckets[currentGroup].length > 0) {
      currentGroup = "other";
      buckets.other.push(itemText);
      lastItemIndex = buckets.other.length - 1;
      return;
    }

    if (/^[-*•\u2022]/.test(line) && lastItemIndex >= 0 && buckets[currentGroup][lastItemIndex]) {
      buckets[currentGroup][lastItemIndex] = `${buckets[currentGroup][lastItemIndex]}\n${itemText}`;
      return;
    }

    buckets[currentGroup] = buckets[currentGroup] || [];
    buckets[currentGroup].push(itemText);
    lastItemIndex = buckets[currentGroup].length - 1;
  });

  return groups
    .map((group) => ({
      key: group.key,
      title: group.title,
      items: buckets[group.key] || []
    }))
    .filter((group) => group.items.length > 0)
    .concat(buckets.other.length > 0 ? [{ key: "other", title: "Other Details", items: buckets.other }] : []);
}

function getCategoryItems(categories, key) {
  const match = categories.find((item) => item.key === key);
  return match ? match.items : [];
}

function extractPhoneNumber(text) {
  const match = String(text || "").match(/(\+?\d[\d\s-]{7,}\d)/);
  return match ? match[1].trim() : "Not available";
}

function extractLocation(text) {
  const match = String(text || "").match(/(?:location|address|based in|current location)[:\s]+([^\n]+)/i);
  return match ? match[1].trim() : "Not available";
}

function getIndicatorLevel(value, mediumCutoff, highCutoff) {
  if (value >= highCutoff) {
    return "high";
  }

  if (value >= mediumCutoff) {
    return "medium";
  }

  return "low";
}

function getOverallRisk(analysis) {
  if ((analysis.risks || []).length >= 4) {
    return "medium";
  }

  if ((analysis.risks || []).length >= 2) {
    return "low";
  }

  return "low";
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function formatSkillLabel(item) {
  if (!item) {
    return "";
  }

  if (typeof item === "string") {
    return item;
  }

  const name = String(item.name || "").trim();
  const level = String(item.level || "").trim();
  return level ? `${name} (${titleCase(level)})` : name;
}

function formatEducationItem(item) {
  if (typeof item === "string") {
    return item;
  }

  const parts = [
    item.institution,
    item.program,
    item.level ? titleCase(item.level) : "",
    [item.startYear, item.endYear].filter(Boolean).join(" - "),
    item.country,
    item.honours
  ].filter(Boolean);

  return parts.join(" | ");
}

function formatExperienceItem(item) {
  if (typeof item === "string") {
    return item;
  }

  const header = [
    item.title,
    item.organization,
    item.industry,
    item.durationLabel,
    item.isCurrent ? "Current" : ""
  ].filter(Boolean).join(" | ");
  const responsibilities = normalizeArray(item.responsibilities);

  return responsibilities.length > 0
    ? `${header}\n${responsibilities.join("\n")}`
    : header;
}

function formatCertificationItem(item) {
  if (typeof item === "string") {
    return item;
  }

  return [item.name, item.issuer].filter(Boolean).join(" | ");
}

function formatLanguageItem(item) {
  if (typeof item === "string") {
    return item;
  }

  return [item.name, item.level ? titleCase(item.level) : ""].filter(Boolean).join(" | ");
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString()}`;
}

function getProgressStage(progress) {
  if (progress < 22) {
    return {
      title: "Uploading CV",
      description: "Sending the CV file and student profile to the analyzer."
    };
  }

  if (progress < 48) {
    return {
      title: "Reading CV Content",
      description: "Extracting text, profile signals, and study context from the uploaded CV."
    };
  }

  if (progress < 76) {
    return {
      title: "Running AI Matching",
      description: "Comparing the profile with course directions, costs, and university options."
    };
  }

  return {
    title: "Preparing Final Report",
    description: "Finishing the response and building the full consultant-style result."
  };
}

function getAnalysisIdFromLocation(location) {
  const fromParams = location && location.pathname
    ? location.pathname.split("/").filter(Boolean).slice(-1)[0]
    : "";
  if (fromParams && fromParams !== "analyzer") {
    return fromParams;
  }

  const fromSearch = location && location.search
    ? new URLSearchParams(location.search).get("analysisId")
    : "";

  if (fromSearch) {
    return fromSearch;
  }

  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const query = hash.includes("?") ? hash.split("?")[1] : "";
  return new URLSearchParams(query).get("analysisId") || "";
}

function Analyzer(props) {
  const [form, setForm] = React.useState(initialForm);
  const [countries, setCountries] = React.useState([]);
  const [activeAnalysis, setActiveAnalysis] = React.useState(null);
  const [cvFile, setCvFile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitProgress, setSubmitProgress] = React.useState(0);
  const [submitElapsedSeconds, setSubmitElapsedSeconds] = React.useState(0);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [activeSection, setActiveSection] = React.useState("overview");
  const [loadingSavedAnalysis, setLoadingSavedAnalysis] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const analysisId = (props.match && props.match.params && props.match.params.analysisId)
    || getAnalysisIdFromLocation(props.location);
  const isReadOnlyView = Boolean(analysisId);

  const loadCountries = React.useCallback(() => {
    setLoading(true);
    setError("");

    fetchCountries()
      .then((countryData) => {
        setCountries(countryData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  React.useEffect(() => {
    if (activeAnalysis) {
      setActiveSection("overview");
    }
  }, [activeAnalysis]);

  React.useEffect(() => {
    if (!submitting) {
      setSubmitProgress(0);
      setSubmitElapsedSeconds(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSubmitProgress((prev) => {
        if (prev < 22) {
          return prev + 6;
        }

        if (prev < 48) {
          return prev + 4;
        }

        if (prev < 76) {
          return prev + 2;
        }

        return prev >= 84 ? prev : prev + 1;
      });
    }, 450);

    return () => window.clearInterval(timer);
  }, [submitting]);

  React.useEffect(() => {
    if (!submitting) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSubmitElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [submitting]);

  React.useEffect(() => {
    if (!analysisId) {
      return undefined;
    }

    let active = true;
    setLoadingSavedAnalysis(true);
    setError("");

    fetchAnalysisById(analysisId)
      .then((data) => {
        if (!active) return;
        setActiveAnalysis(data);
        setLoadingSavedAnalysis(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoadingSavedAnalysis(false);
      });

    return () => {
      active = false;
    };
  }, [analysisId]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleCountry(countryId) {
    setForm((prev) => {
      const exists = prev.preferredCountries.includes(countryId);

      return {
        ...prev,
        preferredCountries: exists
          ? prev.preferredCountries.filter((item) => item !== countryId)
          : [...prev.preferredCountries, countryId]
      };
    });
  }

  function openFileDialog() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function getCountryFlag(countryName) {
    const flagMap = {
      Australia: "au",
      Canada: "ca",
      "United Kingdom": "gb",
      UK: "gb",
      Ireland: "ie",
      "New Zealand": "nz",
      Germany: "de",
      France: "fr",
      USA: "us",
      "United States": "us",
      Singapore: "sg",
      Malaysia: "my",
      Dubai: "ae",
      UAE: "ae"
    };

    const countryCode = flagMap[countryName];

    if (!countryCode) {
      return null;
    }

    return `https://flagcdn.com/w40/${countryCode}.png`;
  }

  function getInstitutionName(item) {
    return (item.institution && item.institution.name) || item.institutionName || "Unknown institution";
  }

  function getInstitutionType(item) {
    return (item.institution && item.institution.type) || item.institutionType || "institution";
  }

  function getCountryName(item) {
    return (item.institution && item.institution.country && item.institution.country.name) || item.countryName || "Unknown country";
  }

  function getCityName(item) {
    return (item.institution && item.institution.city) || item.city || getCountryName(item);
  }

  function getRankingBand(item) {
    return (item.institution && item.institution.rankingBand) || item.rankingBand || "AI ranked";
  }

  function getIntakeDetails(item) {
    if (item.intakeDetails) {
      return item.intakeDetails;
    }

    const institutionCountry = item.institution && item.institution.country;

    if (institutionCountry && institutionCountry.intakeSeasons && institutionCountry.intakeSeasons.length > 0) {
      return `Typical intakes: ${institutionCountry.intakeSeasons.join(", ")}`;
    }

    const matchingCountry = ((activeAnalysis && activeAnalysis.preferredCountries) || []).find(
      (country) => country.name === getCountryName(item)
    );
    if (matchingCountry && matchingCountry.intakeSeasons && matchingCountry.intakeSeasons.length > 0) {
      return `Typical intakes: ${matchingCountry.intakeSeasons.join(", ")}`;
    }

    return "Intake details available on request";
  }

  async function submitAnalysis(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (countries.length === 0) {
        throw new Error("No company country coverage found yet. Super admin needs to add countries first.");
      }

      if (form.preferredCountries.length === 0) {
        throw new Error("Select at least one target country before analysis.");
      }

      if (!cvFile) {
        throw new Error("Upload the student CV file before analysis.");
      }

      setSubmitting(true);
      const createdAnalysis = await createAnalysisRequest({
        ...form,
        cv: cvFile
      });

      setSubmitProgress(100);
      setSuccess("CV submitted and analyzed successfully.");
      setForm(initialForm);
      setCvFile(null);
      setActiveAnalysis(createdAnalysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel = submitting
    ? "Analyzing CV..."
    : loading
      ? "Loading Countries..."
      : "Submit CV for Analysis";
  const topRecommendations = activeAnalysis ? activeAnalysis.recommendedInstitutions || [] : [];
  const courseRecommendations = topRecommendations.filter((item) => item && getInstitutionName(item) !== "Unknown institution");
  const recommendedUniversities = courseRecommendations.filter((item) => getInstitutionType(item) === "university");
  const recommendedColleges = courseRecommendations.filter((item) => getInstitutionType(item) === "college");
  const cvSourceText = normalizeCvText(activeAnalysis);
  const cvCategories = buildCvCategories(cvSourceText);
  const profileDetails = activeAnalysis && activeAnalysis.profileDetails ? activeAnalysis.profileDetails : {};
  const assessment = activeAnalysis && activeAnalysis.assessment ? activeAnalysis.assessment : {};
  const educationItems = normalizeArray(profileDetails.educationHistory).length > 0
    ? normalizeArray(profileDetails.educationHistory).map(formatEducationItem).filter(Boolean)
    : getCategoryItems(cvCategories, "education");
  const experienceItems = normalizeArray(profileDetails.workExperience).length > 0
    ? normalizeArray(profileDetails.workExperience).map(formatExperienceItem).filter(Boolean)
    : getCategoryItems(cvCategories, "experience");
  const skillItems = normalizeArray(profileDetails.technicalSkills).length > 0
    ? normalizeArray(profileDetails.technicalSkills).map(formatSkillLabel).filter(Boolean)
    : getCategoryItems(cvCategories, "skills");
  const toolItems = normalizeArray(profileDetails.toolsAndSoftware).map(formatSkillLabel).filter(Boolean);
  const projectItems = getCategoryItems(cvCategories, "projects");
  const certificationItems = normalizeArray(profileDetails.certifications).length > 0
    ? normalizeArray(profileDetails.certifications).map(formatCertificationItem).filter(Boolean)
    : getCategoryItems(cvCategories, "certifications");
  const languageItems = normalizeArray(profileDetails.languages).length > 0
    ? normalizeArray(profileDetails.languages).map(formatLanguageItem).filter(Boolean)
    : getCategoryItems(cvCategories, "languages");
  const otherItems = normalizeArray(profileDetails.softSkills).length > 0
    ? normalizeArray(profileDetails.softSkills)
    : getCategoryItems(cvCategories, "other");
  const personalInformation = profileDetails.personalInformation || {};
  const studyPreferences = profileDetails.studyPreferences || {};
  const profileStrength = assessment.profileStrength || {};
  const readinessFromAi = assessment.readinessIndicators || {};
  const riskFromAi = assessment.riskOverview || {};
  const visaReadinessByCountry = normalizeArray(assessment.visaReadinessByCountry);
  const personalInfo = [
    { label: "Full Name", value: personalInformation.fullName || (activeAnalysis ? activeAnalysis.studentName : "Not available") },
    { label: "Email", value: personalInformation.email || (activeAnalysis ? activeAnalysis.email || "Not available" : "Not available") },
    { label: "Phone", value: personalInformation.phone || extractPhoneNumber(cvSourceText) },
    { label: "Country of Origin", value: personalInformation.countryOfOrigin || "Not available" },
    { label: "Current Location", value: personalInformation.currentLocation || extractLocation(cvSourceText) },
    { label: "English Proficiency", value: personalInformation.englishProficiency || (activeAnalysis && activeAnalysis.englishScore ? `${activeAnalysis.englishTestType ? `${titleCase(activeAnalysis.englishTestType)} ` : ""}Score ${activeAnalysis.englishScore}` : "Medium of instruction / pending score") },
    { label: "Marital Status", value: personalInformation.maritalStatus || (activeAnalysis && activeAnalysis.maritalStatus ? titleCase(activeAnalysis.maritalStatus) : "Not available") },
    { label: "Partner Australian Citizen / PR", value: personalInformation.partnerAustralianStatus || (activeAnalysis && activeAnalysis.partnerAustralianStatus ? titleCase(activeAnalysis.partnerAustralianStatus) : "Not available") }
  ];
  const readinessIndicators = [
    { label: "Academic", level: readinessFromAi.academic || getIndicatorLevel(Number(activeAnalysis && activeAnalysis.academicScore), 55, 70) },
    { label: "English", level: readinessFromAi.english || getIndicatorLevel(Number(activeAnalysis && activeAnalysis.englishScore), 5.5, 6.5) },
    { label: "Financial", level: readinessFromAi.financial || getIndicatorLevel(Number(activeAnalysis && activeAnalysis.budget), 15000, 30000) },
    { label: "Overall", level: readinessFromAi.overall || getIndicatorLevel(Number(activeAnalysis && activeAnalysis.suitabilityScore), 60, 80) }
  ];
  const riskIndicators = [
    { label: "Financial", level: riskFromAi.financial || (Number(activeAnalysis && activeAnalysis.budget) >= 30000 ? "low" : "medium") },
    { label: "Academic", level: riskFromAi.academic || (Number(activeAnalysis && activeAnalysis.academicScore) >= 65 ? "low" : "medium") },
    { label: "Visa", level: riskFromAi.visa || (activeAnalysis && activeAnalysis.visaChance === "high" ? "low" : "medium") },
    { label: "English", level: riskFromAi.english || (Number(activeAnalysis && activeAnalysis.englishScore) >= 6.5 ? "low" : "medium") },
    { label: "Overall", level: riskFromAi.overall || getOverallRisk(activeAnalysis || {}) }
  ];
  const sectionItems = [
    { key: "overview", label: "Overview" },
    { key: "profile", label: "Profile" },
    { key: "courses", label: `Courses (${courseRecommendations.length})` },
    { key: "advanced", label: "Advanced" },
    { key: "action-plan", label: "Action Plan" }
  ];
  const progressStage = getProgressStage(submitProgress);

  function renderLevelBadge(level) {
    return <span className={`${s.levelBadge} ${s[`level${titleCase(level)}`]}`}>{titleCase(level)}</span>;
  }

  function renderMetricSlider(label, value, tone) {
    return (
      <div key={label} className={s.metricSliderCard}>
        <div className={s.metricSliderTop}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
        <div className={s.metricSliderTrack}>
          <div className={`${s.metricSliderFill} ${s[`tone${titleCase(tone)}`]}`} style={{ width: `${Math.max(8, Math.min(100, value))}%` }} />
        </div>
      </div>
    );
  }

  function renderSectionContent() {
    if (!activeAnalysis) {
      return null;
    }

    if (activeSection === "overview") {
      return (
        <div className={s.reportSection}>
          <div className={s.reportLead}>{activeAnalysis.summary || "No overview generated yet."}</div>

          <div className={s.overviewGrid}>
            <div className={s.overviewMainCard}>
              <div className={s.reportCardTitle}>Profile Strength</div>
              {renderMetricSlider("Strength", profileStrength.score || activeAnalysis.suitabilityScore || 0, profileStrength.label === "strong" ? "strong" : "medium")}
              <div className={s.reportCardNote}>
                {profileStrength.summary || (activeAnalysis.profileSummary || []).join(" ") || "No profile summary generated yet."}
              </div>
            </div>

            <div className={s.overviewSideCard}>
              <div className={s.reportCardTitle}>Readiness Indicators</div>
              <div className={s.pillGrid}>
                {readinessIndicators.map((item) => (
                  <div key={item.label} className={s.statusPillCard}>
                    <span>{item.label}</span>
                    {renderLevelBadge(item.level)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={s.overviewGrid}>
            <div className={s.overviewMainCard}>
              <div className={s.reportCardTitle}>Risk Overview</div>
              <div className={s.pillGrid}>
                {riskIndicators.map((item) => (
                  <div key={item.label} className={s.statusPillCard}>
                    <span>{item.label}</span>
                    {renderLevelBadge(item.level)}
                  </div>
                ))}
              </div>
              <div className={s.reportCardNote}>
                {riskFromAi.summary || (activeAnalysis.risks || []).join(" ") || "No major risks generated yet."}
              </div>
            </div>

            <div className={s.overviewSideCard}>
              <div className={s.reportCardTitle}>Personal Details</div>
              <div className={s.detailList}>
                {personalInfo.map((item) => (
                  <div key={item.label} className={s.detailRow}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={s.overviewGrid}>
            <div className={s.overviewMainCard}>
              <div className={s.reportCardTitle}>Study Preferences</div>
              <div className={s.detailList}>
                <div className={s.detailRow}>
                  <span>Preferred Field</span>
                  <strong>{studyPreferences.preferredField || (activeAnalysis.bestCourseOptions || []).join(" / ") || activeAnalysis.targetStudyGoal || "Not specified"}</strong>
                </div>
                <div className={s.detailRow}>
                  <span>Study Level</span>
                  <strong>{titleCase(studyPreferences.preferredLevel || activeAnalysis.desiredDegree)}</strong>
                </div>
                <div className={s.detailRow}>
                  <span>Preferred Countries</span>
                  <strong>{normalizeArray(studyPreferences.preferredCountries).join(", ") || (activeAnalysis.preferredCountries || []).map((country) => country.name).join(", ") || "Not selected"}</strong>
                </div>
                <div className={s.detailRow}>
                  <span>Budget</span>
                  <strong>{profileDetails.financialProfile || (activeAnalysis.budget ? `$${activeAnalysis.budget}` : "Not provided")}</strong>
                </div>
              </div>
            </div>

            <div className={s.overviewSideCard}>
              <div className={s.reportCardTitle}>Financial Snapshot</div>
              <div className={s.detailList}>
                <div className={s.detailRow}>
                  <span>Tuition</span>
                  <strong>${(activeAnalysis.costBreakdown && activeAnalysis.costBreakdown.tuitionAnnual) || 0}</strong>
                </div>
                <div className={s.detailRow}>
                  <span>Living Cost</span>
                  <strong>${(activeAnalysis.costBreakdown && activeAnalysis.costBreakdown.livingCostAnnual) || 0}</strong>
                </div>
                <div className={s.detailRow}>
                  <span>Total Year One</span>
                  <strong>${(activeAnalysis.costBreakdown && activeAnalysis.costBreakdown.totalYearOne) || 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "profile") {
      return (
        <div className={s.reportSection}>
          <div className={s.sectionGrid}>
            <div className={s.sectionCard}>
              <div className={s.reportCardTitle}>Personal Information</div>
              <div className={s.detailList}>
                {personalInfo.map((item) => (
                  <div key={item.label} className={s.detailRow}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className={s.sectionCard}>
              <div className={s.reportCardTitle}>Education History</div>
              <div className={s.longList}>
                {educationItems.length > 0 ? educationItems.map((item, index) => (
                  <div key={`education-${index}`} className={s.longListItem}>{item}</div>
                )) : <div className={s.emptyState}>No education details extracted yet.</div>}
              </div>
            </div>
          </div>

          <div className={s.sectionGrid}>
            <div className={s.sectionCard}>
              <div className={s.reportCardTitle}>Work Experience</div>
              <div className={s.longList}>
                {experienceItems.length > 0 ? experienceItems.map((item, index) => (
                  <div key={`experience-${index}`} className={s.longListItem}>{item}</div>
                )) : <div className={s.emptyState}>No work experience extracted yet.</div>}
              </div>
            </div>

            <div className={s.sectionCard}>
              <div className={s.reportCardTitle}>Technical Skills</div>
              <div className={s.chipWrap}>
                {skillItems.length > 0 ? skillItems.map((item, index) => (
                  <span key={`skill-${index}`} className={s.reportChip}>{item}</span>
                )) : <div className={s.emptyState}>No skills extracted yet.</div>}
              </div>

              {toolItems.length > 0 && (
                <>
                  <div className={s.reportSubTitle}>Tools & Software</div>
                  <div className={s.chipWrap}>
                    {toolItems.map((item, index) => (
                      <span key={`tool-${index}`} className={s.reportChip}>{item}</span>
                    ))}
                  </div>
                </>
              )}

              <div className={s.reportSubTitle}>Languages</div>
              <div className={s.longList}>
                {languageItems.length > 0 ? languageItems.map((item, index) => (
                  <div key={`language-${index}`} className={s.longListItem}>{item}</div>
                )) : <div className={s.emptyState}>No language details extracted yet.</div>}
              </div>

              <div className={s.reportSubTitle}>Certifications</div>
              <div className={s.longList}>
                {certificationItems.length > 0 ? certificationItems.map((item, index) => (
                  <div key={`cert-${index}`} className={s.longListItem}>{item}</div>
                )) : <div className={s.emptyState}>No certification details extracted yet.</div>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "courses") {
      return (
        <div className={s.reportSection}>
          <div className={s.sectionCard}>
            <div className={s.reportCardTitle}>Recommended Course Paths</div>
            <div className={s.chipWrap}>
              {(activeAnalysis.bestCourseOptions || []).length > 0 ? activeAnalysis.bestCourseOptions.map((item, index) => (
                <span key={`course-${index}`} className={s.reportChip}>{item}</span>
              )) : <div className={s.emptyState}>No course options generated yet.</div>}
            </div>
          </div>

          <div className={s.sectionCard}>
              <div className={s.reportCardTitle}>Matched Institutions ({courseRecommendations.length})</div>
              <div className={s.recommendationStack}>
              {courseRecommendations.length > 0 ? courseRecommendations.map((item, index) => (
                <div className={s.reportRecommendation} key={`recommendation-${index}`}>
                  <div className={s.reportRecommendationHead}>
                    <div>
                      <div className={s.rankNumber}>Rank #{index + 1}</div>
                      <h5>{getInstitutionName(item)}</h5>
                      <div className={s.mutedLine}>{getInstitutionType(item)} in {getCityName(item)}</div>
                    </div>
                    <div className={s.fitPill}>{item.fitScore || 0}% fit</div>
                  </div>
                  <div className={s.chipWrap}>
                    <span className={s.reportChip}>{getCountryName(item)}</span>
                    <span className={s.reportChip}>{getRankingBand(item)}</span>
                    <span className={s.reportChip}>{formatCurrency(item.annualCost || 0)} year one</span>
                  </div>
                  <div className={s.detailText}><strong>Reason:</strong> {item.reason || "No reason generated yet."}</div>
                  <div className={s.detailText}><strong>Programs:</strong> {(item.matchingPrograms || []).join(", ") || "No program list generated yet."}</div>
                  <div className={s.courseDetailGrid}>
                    <div className={s.courseDetailCard}>
                      <span>Intakes</span>
                      <strong>{getIntakeDetails(item)}</strong>
                    </div>
                    <div className={s.courseDetailCard}>
                      <span>Tuition</span>
                      <strong>{formatCurrency(item.tuitionAnnual || 0)} / year</strong>
                    </div>
                    <div className={s.courseDetailCard}>
                      <span>Living Cost</span>
                      <strong>{formatCurrency(item.livingCostAnnual || 0)} / year</strong>
                    </div>
                    <div className={s.courseDetailCard}>
                      <span>Monthly Living</span>
                      <strong>{formatCurrency(item.monthlyLivingCost || 0)} / month</strong>
                    </div>
                  </div>
                  <div className={s.detailList}>
                    <div className={s.detailRow}>
                      <span>Campus Details</span>
                      <strong>{item.campusDetails || "Campus details available on request."}</strong>
                    </div>
                    <div className={s.detailRow}>
                      <span>Accommodation</span>
                      <strong>{item.accommodationDetails || "Accommodation details available on request."}</strong>
                    </div>
                    <div className={s.detailRow}>
                      <span>Work Opportunities</span>
                      <strong>{item.workOpportunity || "Work opportunity details available on request."}</strong>
                    </div>
                    <div className={s.detailRow}>
                      <span>Scholarships</span>
                      <strong>{item.scholarshipNote || "Scholarship details available on request."}</strong>
                    </div>
                  </div>
                </div>
              )) : <div className={s.emptyState}>No institution recommendations are available yet.</div>}
              </div>
            </div>
        </div>
      );
    }

    if (activeSection === "advanced") {
      return (
        <div className={s.reportSection}>
          <div className={s.sectionGrid}>
            <div className={s.sectionCard}>
              <div className={s.reportCardTitle}>Projects & Extra Details</div>
              <div className={s.longList}>
                {projectItems.length > 0 ? projectItems.map((item, index) => (
                  <div key={`project-${index}`} className={s.longListItem}>{item}</div>
                )) : <div className={s.emptyState}>No project details extracted yet.</div>}
                {normalizeArray(profileDetails.awards).map((item, index) => (
                  <div key={`award-${index}`} className={s.longListItem}>{item}</div>
                ))}
                {otherItems.map((item, index) => (
                  <div key={`other-${index}`} className={s.longListItem}>{item}</div>
                ))}
                {profileDetails.careerGoals && (
                  <div className={s.longListItem}>{profileDetails.careerGoals}</div>
                )}
              </div>
            </div>

            <div className={s.sectionCard}>
              <div className={s.reportCardTitle}>Visa Readiness</div>
              <div className={s.longList}>
                {(visaReadinessByCountry.length > 0 ? visaReadinessByCountry : (activeAnalysis.preferredCountries || []).map((country) => ({
                  countryName: country.name,
                  status: activeAnalysis.visaChance === "high" ? "likely" : activeAnalysis.visaChance,
                  summary: (activeAnalysis.risks || []).join(" "),
                  concerns: []
                }))).map((country, index) => (
                  <div key={country.countryName || index} className={s.longListItem}>
                    {country.countryName}: {titleCase(country.status)}. {country.summary || "No major visa risks generated yet."}
                    {normalizeArray(country.concerns).length > 0 ? ` ${normalizeArray(country.concerns).join(" ")}` : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      );
    }

    return (
      <div className={s.reportSection}>
        <div className={s.sectionGrid}>
          <div className={s.sectionCard}>
            <div className={s.reportCardTitle}>Next Actions</div>
            <div className={s.longList}>
              {(activeAnalysis.nextActions || []).length > 0 ? activeAnalysis.nextActions.map((item, index) => (
                <div key={`action-${index}`} className={s.longListItem}>{item}</div>
              )) : <div className={s.emptyState}>No next actions generated yet.</div>}
            </div>
          </div>

          <div className={s.sectionCard}>
            <div className={s.reportCardTitle}>Strategy</div>
            <div className={s.longList}>
              {(activeAnalysis.recommendationStrategy || []).length > 0 ? activeAnalysis.recommendationStrategy.map((item, index) => (
                <div key={`strategy-${index}`} className={s.longListItem}>{item}</div>
              )) : <div className={s.emptyState}>No strategy generated yet.</div>}
            </div>

            <div className={s.reportSubTitle}>Risk Mitigation</div>
            <div className={s.longList}>
              {(activeAnalysis.risks || []).length > 0 ? activeAnalysis.risks.map((item, index) => (
                <div key={`risk-${index}`} className={s.longListItem}>{item}</div>
              )) : <div className={s.emptyState}>No major risks generated yet.</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {submitting && (
        <div className={s.processingOverlay}>
          <div className={s.processingCard}>
            <div className={s.processingPulse} />
            <div className={s.processingEyebrow}>AI Analysis In Progress</div>
            <h2 className={s.processingTitle}>{progressStage.title}</h2>
            <p className={s.processingText}>{progressStage.description}</p>

            <div className={s.processingMeta}>
              <span>{cvFile ? cvFile.name : "CV file attached"}</span>
              <strong>{submitElapsedSeconds}s elapsed</strong>
            </div>

            <div className={s.processingTrack}>
              <div className={s.processingFill} style={{ width: `${submitProgress}%` }} />
            </div>

            {/* <div className={s.processingNote}>
              Large CV files and OpenAI analysis can take a little longer. The report will open automatically when ready.
            </div> */}

            <div className={s.processingSteps}>
              <div className={`${s.processingStep} ${submitProgress >= 10 ? s.processingStepActive : ""}`}>Upload</div>
              <div className={`${s.processingStep} ${submitProgress >= 28 ? s.processingStepActive : ""}`}>Extract</div>
              <div className={`${s.processingStep} ${submitProgress >= 52 ? s.processingStepActive : ""}`}>Match</div>
              <div className={`${s.processingStep} ${submitProgress >= 78 ? s.processingStepActive : ""}`}>Report</div>
            </div>
          </div>
        </div>
      )}

      <div className={s.header}>
        <div>
          <h1 className="page-title mb-1">CV Analyzer</h1>
          <p className={s.subtitle}>
            {isReadOnlyView
              ? "Review the saved AI analysis in the same workspace used for live CV matching."
              : "Upload the student CV, choose the target country, and generate a live AI university matching report."}
          </p>
        </div>
        {isReadOnlyView && (
          <Button color="danger" tag={Link} to="/app/main/analyzer">
            Open New Analysis
          </Button>
        )}
      </div>

      {!isReadOnlyView && (
        <Row>
          <Col xs={12}>
            <Widget title={<h5 className="mb-0">Submit CV for Analysis</h5>}>
            <Form onSubmit={submitAnalysis} encType="multipart/form-data">
              <div className={s.formLayout}>
                <div className={s.formMain}>
                  <div className={s.formGrid}>
                    <FormGroup className={s.formGroup}>
                      <Label className={s.label} for="student-name">Student Name</Label>
                      <Input
                        id="student-name"
                        name="studentName"
                        value={form.studentName}
                        onChange={updateField}
                        placeholder="Enter student full name"
                        className={s.input}
                        required
                      />
                    </FormGroup>

                    <FormGroup className={s.formGroup}>
                      <Label className={s.label} for="student-email">Email Address</Label>
                      <Input
                        id="student-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateField}
                        placeholder="student@email.com"
                        className={s.input}
                      />
                    </FormGroup>

                    <FormGroup className={s.formGroup}>
                      <Label className={s.label} for="student-age">Age</Label>
                      <Input
                        id="student-age"
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={updateField}
                        placeholder="25"
                        className={s.input}
                      />
                    </FormGroup>

                    <FormGroup className={s.formGroup}>
                      <Label className={s.label} for="marital-status">Marital Status</Label>
                      <CustomSelect
                        id="marital-status"
                        name="maritalStatus"
                        value={form.maritalStatus}
                        onChange={updateField}
                        options={[
                          { value: "single", label: "Single" },
                          { value: "married", label: "Married" },
                          { value: "engaged", label: "Engaged" },
                          { value: "divorced", label: "Divorced" },
                          { value: "separated", label: "Separated" },
                          { value: "widowed", label: "Widowed" }
                        ]}
                        placeholder="Select marital status"
                      />
                    </FormGroup>

                    <FormGroup className={s.formGroup}>
                      <Label className={s.label} for="partner-australian-status">Is your partner an Australian citizen or PR holder?</Label>
                      <CustomSelect
                        id="partner-australian-status"
                        name="partnerAustralianStatus"
                        value={form.partnerAustralianStatus}
                        onChange={updateField}
                        options={[
                          { value: "yes", label: "Yes" },
                          { value: "no", label: "No" },
                          { value: "not-applicable", label: "Not applicable" }
                        ]}
                        placeholder="Select partner status"
                      />
                    </FormGroup>

                    <FormGroup className={s.formGroup}>
                      <Label className={s.label} for="desired-degree">Target Degree</Label>
                      <CustomSelect
                        id="desired-degree"
                        name="desiredDegree"
                        value={form.desiredDegree}
                        onChange={updateField}
                        options={[
                          { value: "diploma", label: "Diploma" },
                          { value: "bachelor", label: "Bachelor" },
                          { value: "master", label: "Master" },
                          { value: "phd", label: "PhD" },
                          { value: "other", label: "Other" }
                        ]}
                        placeholder="Select target degree"
                      />
                    </FormGroup>

                    <FormGroup className={s.formGroup}>
                      <Label className={s.label} for="academic-score">Academic Score</Label>
                      <Input
                        id="academic-score"
                        type="number"
                        name="academicScore"
                        value={form.academicScore}
                        onChange={updateField}
                        placeholder="GPA or percentage"
                        className={s.input}
                        required
                      />
                    </FormGroup>

                    <FormGroup className={s.formGroup}>
                      <Label className={s.label} for="english-test-type">English Qualification</Label>
                      <CustomSelect
                        id="english-test-type"
                        name="englishTestType"
                        value={form.englishTestType}
                        onChange={updateField}
                        options={[
                          { value: "ielts", label: "IELTS" },
                          { value: "pte", label: "PTE" },
                          { value: "toefl", label: "TOEFL" },
                          { value: "duolingo", label: "Duolingo" },
                          { value: "moi", label: "Medium of Instruction" },
                          { value: "not-completed", label: "Not completed yet" }
                        ]}
                        placeholder="Select English qualification"
                      />
                    </FormGroup>

                    <FormGroup className={s.formGroup}>
                      <Label className={s.label} for="english-score">English Score</Label>
                      <Input
                        id="english-score"
                        type="number"
                        step="0.1"
                        name="englishScore"
                        value={form.englishScore}
                        onChange={updateField}
                        placeholder="Enter score if available"
                        className={s.input}
                      />
                    </FormGroup>
                  </div>

                  <FormGroup className={s.formGroup}>
                    <Label className={s.label} for="study-goal">Study Goal</Label>
                    <Input
                      id="study-goal"
                      type="text"
                      name="targetStudyGoal"
                      value={form.targetStudyGoal}
                      onChange={updateField}
                      placeholder="Example: Looking for Australia master's campus"
                      className={s.input}
                    />
                  </FormGroup>

                  <FormGroup className={s.formGroup}>
                    <Label className={s.label} for="student-budget">Budget</Label>
                    <Input
                      id="student-budget"
                      type="number"
                      name="budget"
                      value={form.budget}
                      onChange={updateField}
                      placeholder="Estimated annual budget"
                      className={s.input}
                    />
                  </FormGroup>
                </div>

                <div className={s.formSide}>
                  <div className={s.sectionBlock}>
                    <div className={s.sectionHead}>
                      <div>
                        <div className={s.sectionTitle}>Target Countries</div>
                        <div className={s.sectionHint}>Choose one or more countries for AI matching.</div>
                      </div>
                    </div>

                    <div className={s.countryGrid}>
                      {countries.map((country) => {
                        const selected = form.preferredCountries.includes(country._id);

                        return (
                          <button
                            key={country._id}
                            type="button"
                            className={`${s.countryOption} ${selected ? s.countryOptionActive : ""}`}
                            onClick={() => toggleCountry(country._id)}
                          >
                            <span className={s.countryFlag}>
                              {getCountryFlag(country.name) ? (
                                <img src={getCountryFlag(country.name)} alt={`${country.name} flag`} className={s.countryFlagImage} />
                              ) : (
                                <span className={s.countryFlagFallback}>•</span>
                              )}
                            </span>
                            <div className={s.countryContent}>
                              <span className={s.countryName}>{country.name}</span>
                              <span className={s.countryState}>{selected ? "Selected" : "Tap to select"}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {!loading && countries.length === 0 && (
                      <div className={s.helperText}>No company country coverage found yet. Super admin needs to add countries first.</div>
                    )}
                  </div>

                  <div className={s.sectionBlock}>
                    <div className={s.sectionHead}>
                      <div>
                        <div className={s.sectionTitle}>CV Upload</div>
                        <div className={s.sectionHint}>Upload PDF, DOCX, or text CV file for analysis.</div>
                      </div>
                    </div>

                    <button type="button" className={s.uploadCard} onClick={openFileDialog}>
                      <span className={s.uploadIcon}>AI</span>
                      <div className={s.uploadBody}>
                        <strong>{cvFile ? cvFile.name : "Choose CV File"}</strong>
                        <span>{cvFile ? "File selected and ready for analysis" : "Click here to upload student CV"}</span>
                      </div>
                      <span className={s.uploadAction}>{cvFile ? "Replace File" : "Upload"}</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className={s.hiddenInput}
                      onChange={(event) => setCvFile(event.target.files[0] || null)}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                  </div>
                </div>
              </div>

              <FormGroup className={s.formGroup}>
                <Label className={s.label} for="cv-notes">CV Notes</Label>
                <Input
                  id="cv-notes"
                  type="textarea"
                  rows="5"
                  name="cvText"
                  value={form.cvText}
                  onChange={updateField}
                  placeholder="Add extra notes, visa context, student preference, or counselor comments"
                  className={`${s.input} ${s.textarea}`}
                />
              </FormGroup>

              <FormGroup className={s.formGroup}>
                <Label className={s.label} for="student-question">Student Question for AI</Label>
                <Input
                  id="student-question"
                  type="textarea"
                  rows="4"
                  name="studentQuestion"
                  value={form.studentQuestion}
                  onChange={updateField}
                  placeholder="Example: I want to know my Australia master's options, visa strength, cost, and best-fit universities."
                  className={`${s.input} ${s.textarea}`}
                />
              </FormGroup>

              {error && <div className={s.feedbackError}>{error}</div>}
              {success && <div className={s.feedbackSuccess}>{success}</div>}
              <div className={s.formActions}>
                <Button color="danger" type="submit" className={s.submitButton} disabled={submitting || loading}>
                  {submitLabel}
                </Button>
              </div>
            </Form>
            </Widget>
          </Col>
        </Row>
      )}

      <Row>
        <Col xs={12}>
          <Widget title={<h5 className="mb-0">Live Analysis</h5>}>
            {loadingSavedAnalysis && (
              <div className={s.emptyState}>Loading saved analysis...</div>
            )}

            {!loadingSavedAnalysis && !activeAnalysis && (
              <div className={s.emptyState}>Upload a CV and run analysis to show the live result here.</div>
            )}

            {!loadingSavedAnalysis && activeAnalysis && (
              <div className={s.liveStatusCard}>
                <div className={s.liveStatusTop}>
                  <div>
                    <div className={s.detailLabel}>Current Student</div>
                    <div className={s.detailValue}>{activeAnalysis.studentName}</div>
                  </div>
                  <Badge color={activeAnalysis.suitabilityScore >= 85 ? "success" : "warning"}>
                    {activeAnalysis.suitabilityScore || 0}% Match
                  </Badge>
                </div>

                <div className={s.liveStatusGrid}>
                  <div className={s.infoCard}>
                    <strong>Degree</strong>
                    <div>{activeAnalysis.desiredDegree}</div>
                  </div>
                  <div className={s.infoCard}>
                    <strong>Status</strong>
                    <div>{activeAnalysis.analysisStatus}</div>
                  </div>
                  <div className={s.infoCard}>
                    <strong>Countries</strong>
                    <div>{(activeAnalysis.preferredCountries || []).map((country) => country.name).join(", ") || "Not selected"}</div>
                  </div>
                  <div className={s.infoCard}>
                    <strong>Top Match</strong>
                    <div>{courseRecommendations[0] ? getInstitutionName(courseRecommendations[0]) : "No recommendation yet"}</div>
                  </div>
                </div>

                <div className={s.metricStrip}>
                  <div className={s.metricCard}>
                    <span>Universities</span>
                    <strong>{recommendedUniversities.length}</strong>
                  </div>
                  <div className={s.metricCard}>
                    <span>Colleges</span>
                    <strong>{recommendedColleges.length}</strong>
                  </div>
                  <div className={s.metricCard}>
                    <span>Total Options</span>
                    <strong>{courseRecommendations.length}</strong>
                  </div>
                </div>
              </div>
            )}
          </Widget>
        </Col>
      </Row>

      {activeAnalysis && (
        <Row>
          <Col xs={12}>
            <Widget title={<h5 className="mb-0">CV Analysis Workspace</h5>}>
              <div className={s.sectionNav}>
                {sectionItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`${s.sectionNavButton} ${activeSection === item.key ? s.sectionNavButtonActive : ""}`}
                    onClick={() => setActiveSection(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {renderSectionContent()}
            </Widget>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default Analyzer;
