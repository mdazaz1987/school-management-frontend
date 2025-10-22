import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Avatar', size = 24, className }) => {
  const [error, setError] = React.useState(false);
  const showImg = !!src && !error;
  return (
    <span className={`d-inline-flex align-items-center ${className || ''}`}>
      {showImg ? (
        <img
          src={src as string}
          alt={alt}
          className="rounded-circle"
          style={{ width: size, height: size, objectFit: 'cover' }}
          onError={() => setError(true)}
        />
      ) : (
        <i className="bi bi-person-circle" style={{ fontSize: size * 0.9 }} />
      )}
    </span>
  );
};
