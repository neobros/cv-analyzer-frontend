import React from "react";
import {
  Row,
  Col,
  Badge
} from "reactstrap";
import Widget from "../../components/Widget";
import {
  createCountryRequest,
  fetchCountries,
  getStoredUser,
  updateCountryRequest
} from "../../api";
import s from "./CountryCoverage.module.scss";

const COUNTRY_OPTIONS = [
  { name: "Australia", flag: "AU", currency: "AUD" },
  { name: "Austria", flag: "AT", currency: "EUR" },
  { name: "Belgium", flag: "BE", currency: "EUR" },
  { name: "Canada", flag: "CA", currency: "CAD" },
  { name: "China", flag: "CN", currency: "CNY" },
  { name: "Cyprus", flag: "CY", currency: "EUR" },
  { name: "Denmark", flag: "DK", currency: "DKK" },
  { name: "Finland", flag: "FI", currency: "EUR" },
  { name: "France", flag: "FR", currency: "EUR" },
  { name: "Germany", flag: "DE", currency: "EUR" },
  { name: "Hungary", flag: "HU", currency: "HUF" },
  { name: "Ireland", flag: "IE", currency: "EUR" },
  { name: "Italy", flag: "IT", currency: "EUR" },
  { name: "Japan", flag: "JP", currency: "JPY" },
  { name: "Lithuania", flag: "LT", currency: "EUR" },
  { name: "Malaysia", flag: "MY", currency: "MYR" },
  { name: "Malta", flag: "MT", currency: "EUR" },
  { name: "Mauritius", flag: "MU", currency: "MUR" },
  { name: "Netherlands", flag: "NL", currency: "EUR" },
  { name: "New Zealand", flag: "NZ", currency: "NZD" },
  { name: "Norway", flag: "NO", currency: "NOK" },
  { name: "Poland", flag: "PL", currency: "PLN" },
  { name: "Portugal", flag: "PT", currency: "EUR" },
  { name: "Singapore", flag: "SG", currency: "SGD" },
  { name: "South Korea", flag: "KR", currency: "KRW" },
  { name: "Spain", flag: "ES", currency: "EUR" },
  { name: "Sweden", flag: "SE", currency: "SEK" },
  { name: "Switzerland", flag: "CH", currency: "CHF" },
  { name: "Turkey", flag: "TR", currency: "TRY" },
  { name: "United Arab Emirates", flag: "AE", currency: "AED" },
  { name: "United Kingdom", flag: "GB", currency: "GBP" },
  { name: "United States", flag: "US", currency: "USD" }
];

function getCountryMeta(name) {
  return COUNTRY_OPTIONS.find((item) => item.name === name);
}

function getFlagUrl(code) {
  if (!code || code.length !== 2) return "";
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}

function CountryCoverage() {
  const user = getStoredUser();
  const isSuperAdmin = user && user.role === "super-admin";
  const [countries, setCountries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [statusUpdatingKey, setStatusUpdatingKey] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const loadCountries = React.useCallback(() => {
    setLoading(true);
    setError("");

    return fetchCountries()
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

  const activeCountries = countries.filter((country) => country.isActive);
  const countriesByName = countries.reduce((acc, country) => {
    acc[country.name] = country;
    return acc;
  }, {});
  const availableCountries = [
    ...COUNTRY_OPTIONS,
    ...countries
      .filter((country) => !getCountryMeta(country.name))
      .map((country) => ({
        name: country.name,
        flag: "",
        currency: country.currency || ""
      }))
  ].sort((a, b) => a.name.localeCompare(b.name));

  const handleToggleStatus = (countryOption) => {
    if (!isSuperAdmin) return;

    const existingCountry = countriesByName[countryOption.name];
    const requestKey = existingCountry ? existingCountry._id : countryOption.name;

    setStatusUpdatingKey(requestKey);
    setError("");
    setSuccess("");

    const action = existingCountry
      ? updateCountryRequest(existingCountry._id, { isActive: !existingCountry.isActive })
      : createCountryRequest({
        name: countryOption.name,
        currency: (countryOption.currency || "").trim().toUpperCase(),
        isActive: true
      });

    action
      .then(() => {
        const nextState = existingCountry ? !existingCountry.isActive : true;
        setSuccess(`${countryOption.name} is now ${nextState ? "enabled" : "disabled"}.`);
        return loadCountries();
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setStatusUpdatingKey("");
      });
  };

  return (
    <div>
      <div className={s.header}>
        <div>
          <h1 className="page-title mb-1">Country Coverage</h1>
          <p className={s.subtitle}>
            All countries are shown here. Click a country to enable it, and click again to disable it.
          </p>
        </div>
        <div className={s.summaryGroup}>
          <div className={s.summaryCard}>
            <strong>{availableCountries.length}</strong>
            <span>Available</span>
          </div>
          <div className={s.summaryCard}>
            <strong>{activeCountries.length}</strong>
            <span>Enabled</span>
          </div>
        </div>
      </div>

      <Row>
        <Col xs={12}>
          <Widget>
            {error && <div className={s.feedbackError}>{error}</div>}
            {success && <div className={s.feedbackSuccess}>{success}</div>}
            {loading && <div className={s.emptyState}>Loading country coverage...</div>}
            {!loading && availableCountries.length > 0 && (
              <div className={s.countryGrid}>
                {availableCountries.map((countryOption) => {
                  const existingCountry = countriesByName[countryOption.name];
                  const isActive = existingCountry ? existingCountry.isActive : false;
                  const requestKey = existingCountry ? existingCountry._id : countryOption.name;

                  return (
                    <button
                      type="button"
                      key={countryOption.name}
                      className={`${s.countryCard} ${isActive ? s.countryCardActive : s.countryCardInactive}`}
                      onClick={() => handleToggleStatus(countryOption)}
                      disabled={!isSuperAdmin || statusUpdatingKey === requestKey}
                    >
                      <div className={s.flagWrap}>
                        {countryOption.flag ? (
                          <img
                            src={getFlagUrl(countryOption.flag)}
                            alt={`${countryOption.name} flag`}
                            className={s.flagImage}
                          />
                        ) : (
                          <span className={s.flagFallback}>GL</span>
                        )}
                      </div>
                      <div className={s.countryInfo}>
                        <div className={s.countryTop}>
                          <h4>{countryOption.name}</h4>
                          <Badge color={isActive ? "success" : "secondary"}>
                            {isActive ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className={s.countryMeta}>
                          Currency: {existingCountry?.currency || countryOption.currency || "-"}
                        </div>
                        <div className={s.actionText}>
                          {statusUpdatingKey === requestKey
                            ? "Saving..."
                            : isSuperAdmin
                              ? isActive
                                ? "Click to disable"
                                : "Click to enable"
                              : "View only"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Widget>
        </Col>
      </Row>
    </div>
  );
}

export default CountryCoverage;
