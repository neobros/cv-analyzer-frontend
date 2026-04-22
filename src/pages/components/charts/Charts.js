import React from "react";
import { Row, Col, Badge, Progress, Button, Form, FormGroup, Label } from "reactstrap";
import Widget from "../../../components/Widget";
import { fetchAiSettings, updateAiSettings } from "../../../api";
import s from "./Charts.module.scss";

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

function Charts() {
  const [settings, setSettings] = React.useState(null);
  const [form, setForm] = React.useState({
    provider: "hybrid-score",
    model: "gpt-4.1"
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  React.useEffect(() => {
    let active = true;

    fetchAiSettings()
      .then((data) => {
        if (!active) return;
        setSettings(data);
        setForm({
          provider: data.provider || "hybrid-score",
          model: data.model || "gpt-4.1"
        });
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

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateAiSettings({
        provider: form.provider,
        model: form.model
      });

      setSettings(updated);
      setForm({
        provider: updated.provider || "hybrid-score",
        model: updated.model || "gpt-4.1"
      });
      setSuccess("AI settings updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const weights = settings ? [
    { label: "Academics", value: settings.scoringWeights.academics },
    { label: "English", value: settings.scoringWeights.english },
    { label: "Budget", value: settings.scoringWeights.finance },
    { label: "Country / Degree Fit", value: settings.scoringWeights.relevance }
  ] : [];

  return (
    <div>
      <div className={s.header}>
        <div>
          <h1 className="page-title mb-1">AI Control Center</h1>
          <p className={s.subtitle}>
            Super admin can switch the active AI provider and model used for CV analysis.
          </p>
        </div>
      </div>

      <Row>
        <Col lg={5}>
          <Widget title={<h5 className="mb-0">Provider Selection</h5>}>
            {loading && <div className={s.emptyState}>Loading AI settings...</div>}
            {!loading && error && <div className={s.emptyState}>{error}</div>}
            {!loading && settings && (
              <>
                <div className={s.providerCard}>
                  <Badge color="danger" pill>Active</Badge>
                  <h4 className="mt-3">{settings.provider}</h4>
                  <div className={s.meta}>Model: {settings.model}</div>
                  <div className={s.meta}>Updated: {new Date(settings.updatedAt).toLocaleString()}</div>
                </div>

                <Form onSubmit={saveSettings} className={s.settingsForm}>
                  <FormGroup>
                    <Label className={s.label} for="provider">AI Provider</Label>
                    <CustomSelect
                      id="provider"
                      name="provider"
                      value={form.provider}
                      onChange={updateField}
                      options={[
                        { value: "openai", label: "openai" },
                        { value: "hybrid-score", label: "hybrid-score" },
                        { value: "manual-review", label: "manual-review" }
                      ]}
                      placeholder="Select AI provider"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label className={s.label} for="model">Model</Label>
                    <CustomSelect
                      id="model"
                      name="model"
                      value={form.model}
                      onChange={updateField}
                      options={[
                        { value: "gpt-4.1", label: "gpt-4.1" },
                        { value: "gpt-4.1-mini", label: "gpt-4.1-mini" },
                        { value: "gpt-4o", label: "gpt-4o" }
                      ]}
                      placeholder="Select model"
                    />
                  </FormGroup>

                  {success && <div className={s.successBox}>{success}</div>}
                  {error && <div className={s.errorBox}>{error}</div>}

                  <div className={s.formActions}>
                    <Button color="danger" type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save AI Settings"}
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </Widget>
        </Col>
        <Col lg={7}>
          <Widget title={<h5 className="mb-0">Scoring Weights</h5>}>
            {!loading && !error && !settings && <div className={s.emptyState}>No AI settings found.</div>}
            {weights.map((weight) => (
              <div key={weight.label} className={s.weightItem}>
                <div className={s.weightHeader}>
                  <span>{weight.label}</span>
                  <strong>{weight.value}%</strong>
                </div>
                <Progress value={weight.value} color="primary" className="progress-xs" />
              </div>
            ))}
            {settings && (
              <div className={s.reviewMode}>
                <strong>Prompt:</strong> {settings.prompts && settings.prompts.cvAnalysis}
              </div>
            )}
          </Widget>
        </Col>
      </Row>
    </div>
  );
}

export default Charts;
