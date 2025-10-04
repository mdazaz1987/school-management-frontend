import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export const DebugAuth: React.FC = () => {
  const { user, isAuthenticated, hasRole } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    // Get info from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    setStorageInfo({
      hasToken: !!token,
      token: token ? `${token.substring(0, 50)}...` : 'None',
      userString: userStr,
      userParsed: userStr ? JSON.parse(userStr) : null,
    });

    // Decode JWT token
    if (token) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        setTokenInfo(payload);
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
  }, []);

  const testBackendAuth = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://141.148.218.230:9090/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Backend response status:', response.status);
      const data = await response.json();
      console.log('Backend response data:', data);
      
      if (response.ok) {
        alert(`✅ Backend Auth Success! Got ${data.length} classes`);
      } else {
        alert(`❌ Backend Auth Failed: ${response.status}`);
      }
    } catch (err: any) {
      console.error('Backend test error:', err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  return (
    <Layout>
      <Container className="py-4">
        <h2 className="mb-4">Authentication Debug Information</h2>

        {/* Auth Context Info */}
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">Auth Context (from useAuth)</h5>
          </Card.Header>
          <Card.Body>
            <Table bordered>
              <tbody>
                <tr>
                  <th style={{ width: '200px' }}>isAuthenticated</th>
                  <td>
                    {isAuthenticated ? (
                      <span className="text-success">✅ True</span>
                    ) : (
                      <span className="text-danger">❌ False</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>User Object</th>
                  <td><pre>{JSON.stringify(user, null, 2)}</pre></td>
                </tr>
                <tr>
                  <th>User Roles</th>
                  <td>
                    {user?.roles ? (
                      <div>
                        {user.roles.map((role: string) => (
                          <span key={role} className="badge bg-info me-2">{role}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-danger">No roles found</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>hasRole('ADMIN')</th>
                  <td>
                    {hasRole('ADMIN') ? (
                      <span className="text-success">✅ True</span>
                    ) : (
                      <span className="text-danger">❌ False</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>hasRole('ROLE_ADMIN')</th>
                  <td>
                    {hasRole('ROLE_ADMIN' as any) ? (
                      <span className="text-success">✅ True</span>
                    ) : (
                      <span className="text-danger">❌ False</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* localStorage Info */}
        <Card className="mb-4">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">localStorage Information</h5>
          </Card.Header>
          <Card.Body>
            <Table bordered>
              <tbody>
                <tr>
                  <th style={{ width: '200px' }}>Has Token</th>
                  <td>
                    {storageInfo?.hasToken ? (
                      <span className="text-success">✅ Yes</span>
                    ) : (
                      <span className="text-danger">❌ No</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Token (truncated)</th>
                  <td><code>{storageInfo?.token}</code></td>
                </tr>
                <tr>
                  <th>User String</th>
                  <td><pre>{storageInfo?.userString}</pre></td>
                </tr>
                <tr>
                  <th>User Parsed</th>
                  <td><pre>{JSON.stringify(storageInfo?.userParsed, null, 2)}</pre></td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* JWT Token Info */}
        {tokenInfo && (
          <Card className="mb-4">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">JWT Token Payload</h5>
            </Card.Header>
            <Card.Body>
              <Table bordered>
                <tbody>
                  <tr>
                    <th style={{ width: '200px' }}>Subject (sub)</th>
                    <td>{tokenInfo.sub}</td>
                  </tr>
                  <tr>
                    <th>Roles/Authorities</th>
                    <td>
                      <pre>{JSON.stringify(tokenInfo.roles || tokenInfo.authorities || 'Not found', null, 2)}</pre>
                    </td>
                  </tr>
                  <tr>
                    <th>Issued At (iat)</th>
                    <td>{tokenInfo.iat ? new Date(tokenInfo.iat * 1000).toLocaleString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Expires At (exp)</th>
                    <td>
                      {tokenInfo.exp ? (
                        <>
                          {new Date(tokenInfo.exp * 1000).toLocaleString()}
                          {tokenInfo.exp * 1000 < Date.now() && (
                            <Alert variant="danger" className="mt-2 mb-0">
                              ⚠️ Token has EXPIRED!
                            </Alert>
                          )}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Full Payload</th>
                    <td><pre>{JSON.stringify(tokenInfo, null, 2)}</pre></td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

        {/* Test Button */}
        <Card>
          <Card.Header className="bg-danger text-white">
            <h5 className="mb-0">Backend Authentication Test</h5>
          </Card.Header>
          <Card.Body>
            <p>Click the button below to test if your token works with the backend:</p>
            <Button variant="primary" onClick={testBackendAuth}>
              Test Backend Authentication
            </Button>
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};
