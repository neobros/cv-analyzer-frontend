import React from "react";
import {
  Row,
  Col,
  Table,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Modal,
  ModalBody
} from "reactstrap";
import Widget from "../../components/Widget";
import {
  createUserRequest,
  fetchUsers,
  updateUserRequest
} from "../../api";
import s from "./Notifications.module.scss";

const initialForm = {
  name: "",
  email: "",
  password: "",
  status: "active"
};

function formatRole(role) {
  if (!role) return "Account";
  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function Notifications() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState("");
  const [passwordUpdatingId, setPasswordUpdatingId] = React.useState("");
  const [passwordModalUser, setPasswordModalUser] = React.useState(null);
  const [passwordDraft, setPasswordDraft] = React.useState("");
  const [form, setForm] = React.useState(initialForm);

  const loadUsers = React.useCallback(() => {
    setLoading(true);
    setError("");

    return fetchUsers()
      .then((userData) => {
        setUsers(userData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleCreateWorker = (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    createUserRequest({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      status: form.status
    })
      .then(() => {
        setSuccess("Worker account created successfully.");
        setForm(initialForm);
        return loadUsers();
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleToggleStatus = (user) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";

    setStatusUpdatingId(user._id);
    setError("");
    setSuccess("");

    updateUserRequest(user._id, { status: nextStatus })
      .then(() => {
        setSuccess(`${user.name} is now ${nextStatus}.`);
        return loadUsers();
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setStatusUpdatingId("");
      });
  };

  const openPasswordModal = (user) => {
    setPasswordModalUser(user);
    setPasswordDraft("");
    setError("");
    setSuccess("");
  };

  const closePasswordModal = () => {
    if (passwordUpdatingId) return;
    setPasswordModalUser(null);
    setPasswordDraft("");
  };

  const handlePasswordUpdate = () => {
    if (!passwordModalUser) return;

    const nextPassword = passwordDraft.trim();

    if (!nextPassword || nextPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setSuccess("");
      return;
    }

    setPasswordUpdatingId(passwordModalUser._id);
    setError("");
    setSuccess("");

    updateUserRequest(passwordModalUser._id, { password: nextPassword })
      .then(() => {
        setSuccess(`${passwordModalUser.name}'s password was updated.`);
        setPasswordModalUser(null);
        setPasswordDraft("");
        return loadUsers();
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setPasswordUpdatingId("");
      });
  };

  return (
    <div>
      <div className={s.header}>
        <div>
          <h1 className="page-title mb-1">Worker Management</h1>
          <p className={s.subtitle}>
            Add workers, manage access, and switch each account between active and inactive.
          </p>
        </div>
      </div>

      <Row>
        <Col xl={5} lg={6}>
          <Widget title={<h5 className="mb-0">Add New Worker</h5>}>
            <Form onSubmit={handleCreateWorker}>
              <div className={s.formGrid}>
                <FormGroup className={s.formGroup}>
                  <Label className={s.label} for="worker-name">Full Name</Label>
                  <Input
                    id="worker-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter worker name"
                    className={s.input}
                    required
                  />
                </FormGroup>

                <FormGroup className={s.formGroup}>
                  <Label className={s.label} for="worker-email">Email Address</Label>
                  <Input
                    id="worker-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="worker@company.com"
                    className={s.input}
                    required
                  />
                </FormGroup>

                <FormGroup className={s.formGroup}>
                  <Label className={s.label} for="worker-password">Login Password</Label>
                  <Input
                    id="worker-password"
                    name="password"
                    type="text"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Set worker login password"
                    className={s.input}
                    required
                    minLength={6}
                  />
                </FormGroup>

                <FormGroup className={s.formGroup}>
                  <Label className={s.label}>Initial Status</Label>
                  <div className={s.statusSelector} role="group" aria-label="Initial status">
                    <button
                      type="button"
                      className={`${s.statusOption} ${form.status === "active" ? s.statusOptionActive : ""}`}
                      onClick={() => setForm((current) => ({ ...current, status: "active" }))}
                    >
                      <span className={`${s.statusDot} ${s.statusDotActive}`} />
                      Active
                    </button>
                    <button
                      type="button"
                      className={`${s.statusOption} ${form.status === "inactive" ? s.statusOptionInactive : ""}`}
                      onClick={() => setForm((current) => ({ ...current, status: "inactive" }))}
                    >
                      <span className={`${s.statusDot} ${s.statusDotInactive}`} />
                      Inactive
                    </button>
                  </div>
                </FormGroup>
              </div>

              <div className={s.formActions}>
                <Button color="info" className={s.submitButton} disabled={submitting}>
                  {submitting ? "Creating..." : "Create Worker"}
                </Button>
              </div>
            </Form>
          </Widget>
        </Col>

        <Col xl={7} lg={6}>
          <Widget title={<h5 className="mb-0">Workers</h5>}>
            {error && <div className={s.feedbackError}>{error}</div>}
            {success && <div className={s.feedbackSuccess}>{success}</div>}
            {loading && <div className={s.emptyState}>Loading workers...</div>}
            {!loading && !error && users.length === 0 && <div className={s.emptyState}>No workers created yet.</div>}
            {!loading && users.length > 0 && (
              <div className={s.tableWrap}>
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Password</th>
                      <th>Status</th>
                      <th className="text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isSuperAdmin = user.role === "super-admin";
                      const isActive = user.status === "active";

                      return (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>
                            <span className={`${s.roleChip} ${isSuperAdmin ? s.roleChipAdmin : s.roleChipWorker}`}>
                              {formatRole(user.role)}
                            </span>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            {isSuperAdmin ? (
                              <span className={s.lockedText}>Protected</span>
                            ) : (
                              <div className={s.passwordCell}>
                                <div className={s.passwordValue}>{user.passwordPreview || "-"}</div>
                                <button
                                  type="button"
                                  className={`${s.actionButton} ${s.actionButtonNeutral} ${s.passwordChangeButton}`}
                                  onClick={() => openPasswordModal(user)}
                                >
                                  Change
                                </button>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`${s.statusChip} ${isActive ? s.statusChipActive : s.statusChipInactive}`}>
                              <span className={`${s.statusDot} ${isActive ? s.statusDotActive : s.statusDotInactive}`} />
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-right">
                            {isSuperAdmin ? (
                              <span className={s.lockedText}>Protected</span>
                            ) : (
                              <button
                                type="button"
                                className={`${s.actionButton} ${isActive ? s.actionButtonDeactivate : s.actionButtonActivate}`}
                                onClick={() => handleToggleStatus(user)}
                                disabled={statusUpdatingId === user._id}
                              >
                                {statusUpdatingId === user._id
                                  ? "Saving..."
                                  : isActive
                                    ? "Deactivate"
                                    : "Activate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Widget>
        </Col>
      </Row>

      <Modal
        isOpen={!!passwordModalUser}
        toggle={closePasswordModal}
        centered
        modalClassName={s.passwordModalWrap}
        contentClassName={s.passwordModalContent}
      >
        <ModalBody className={s.passwordModalBody}>
          <div className={s.passwordModalHeader}>
            <div className={s.passwordModalTitle}>Change Password</div>
            <button
              type="button"
              className={s.passwordModalClose}
              onClick={closePasswordModal}
              disabled={!!passwordUpdatingId}
              aria-label="Close password dialog"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className={s.modalText}>
            {passwordModalUser ? `Update login password for ${passwordModalUser.name}.` : ""}
          </div>
          <div className={s.modalFieldWrap}>
            <Label className={s.label} for="worker-password-modal">New Password</Label>
            <Input
              id="worker-password-modal"
              type="text"
              value={passwordDraft}
              onChange={(event) => setPasswordDraft(event.target.value)}
              placeholder="Enter new password"
              className={s.input}
              minLength={6}
            />
          </div>
          <div className={s.modalFooter}>
            <button
              type="button"
              className={s.modalCancelButton}
              onClick={closePasswordModal}
              disabled={!!passwordUpdatingId}
            >
              Cancel
            </button>
            <button
              type="button"
              className={s.modalSaveButton}
              onClick={handlePasswordUpdate}
              disabled={!!passwordUpdatingId}
            >
              {passwordUpdatingId ? "Saving..." : "Save Password"}
            </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}

export default Notifications;
