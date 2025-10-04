import React from 'react';
import { Alert } from 'react-bootstrap';
import { ValidationError } from '../utils/formValidation';

interface ErrorDisplayProps {
  errors: ValidationError[];
  className?: string;
}

/**
 * Component to display validation errors in a user-friendly way
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, className = '' }) => {
  if (errors.length === 0) return null;

  return (
    <Alert variant="danger" className={className}>
      <Alert.Heading>
        <i className="bi bi-exclamation-triangle me-2"></i>
        Please fix the following errors:
      </Alert.Heading>
      <ul className="mb-0">
        {errors.map((error, index) => (
          <li key={index}>
            <strong>{error.field}:</strong> {error.message}
          </li>
        ))}
      </ul>
    </Alert>
  );
};

interface FieldErrorProps {
  error: string | null;
}

/**
 * Component to display inline field error
 */
export const FieldError: React.FC<FieldErrorProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="invalid-feedback d-block">
      <i className="bi bi-exclamation-circle me-1"></i>
      {error}
    </div>
  );
};
