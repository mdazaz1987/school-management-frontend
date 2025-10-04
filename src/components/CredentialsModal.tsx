import React, { useState } from 'react';
import { Modal, Button, Table, Alert } from 'react-bootstrap';

interface UserCredential {
  email: string;
  password?: string;
  role: string;
  name: string;
}

interface CredentialsModalProps {
  show: boolean;
  onHide: () => void;
  credentials: UserCredential[];
  studentName?: string;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({ 
  show, 
  onHide, 
  credentials,
  studentName 
}) => {
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedFields, setCopiedFields] = useState<{ [key: string]: boolean }>({});

  const togglePasswordVisibility = (email: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFields(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopiedFields(prev => ({ ...prev, [field]: false }));
      }, 2000);
    });
  };

  const handleClose = () => {
    setShowPasswords({});
    setCopiedFields({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-check-circle-fill text-success me-2"></i>
          User Accounts Created Successfully
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="warning">
          <strong>Important:</strong> Please save these credentials securely. 
          You won't be able to see the passwords again after closing this window.
        </Alert>

        {studentName && (
          <p className="mb-3">
            User accounts have been created for <strong>{studentName}</strong> and associated parents/guardians.
          </p>
        )}

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email (Username)</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((cred, index) => (
              <tr key={index}>
                <td>{cred.name}</td>
                <td>
                  <span className={`badge bg-${
                    cred.role === 'STUDENT' ? 'primary' : 
                    cred.role === 'PARENT' ? 'success' : 'info'
                  }`}>
                    {cred.role}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <code>{cred.email}</code>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => copyToClipboard(cred.email, `email-${index}`)}
                    >
                      {copiedFields[`email-${index}`] ? (
                        <i className="bi bi-check-circle-fill text-success"></i>
                      ) : (
                        <i className="bi bi-clipboard"></i>
                      )}
                    </Button>
                  </div>
                </td>
                <td>
                  {cred.password ? (
                    <div className="d-flex align-items-center gap-2">
                      <code style={{ fontFamily: 'monospace' }}>
                        {showPasswords[cred.email] ? cred.password : '••••••••••'}
                      </code>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => togglePasswordVisibility(cred.email)}
                        title={showPasswords[cred.email] ? 'Hide password' : 'Show password'}
                      >
                        {showPasswords[cred.email] ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => copyToClipboard(cred.password!, `password-${index}`)}
                        title="Copy password"
                      >
                        {copiedFields[`password-${index}`] ? (
                          <i className="bi bi-check-circle-fill text-success"></i>
                        ) : (
                          <i className="bi bi-clipboard"></i>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <em className="text-muted">Sent via email</em>
                  )}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => {
                      const credentials = `Email: ${cred.email}\nPassword: ${cred.password || '(sent via email)'}`;
                      copyToClipboard(credentials, `all-${index}`);
                    }}
                  >
                    {copiedFields[`all-${index}`] ? 'Copied!' : 'Copy All'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Alert variant="info" className="mt-3">
          <strong>Next Steps:</strong>
          <ul className="mb-0 mt-2">
            <li>Share these credentials with the respective users securely</li>
            <li>Users can login at the system login page using their email as username</li>
            {credentials.some(c => c.password) && (
              <li>Users with temporary passwords will be required to change their password on first login</li>
            )}
          </ul>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          I've Saved the Credentials
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
