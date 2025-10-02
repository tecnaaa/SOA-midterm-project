import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TuitionPaymentForm from './components/TuitionPaymentForm';
import './App.css';

// Thêm ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lỗi:', error);
    console.error('Chi tiết:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Có lỗi xảy ra</h2>
          <p>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px', cursor: 'pointer' }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleLogin = (user) => {
    console.log("Thông tin đăng nhập:", user);
    setIsLoggedIn(true);
    setUserData(user);
  };

  useEffect(() => {
    console.log("Trạng thái hiện tại:", { isLoggedIn, userData });
  }, [isLoggedIn, userData]);

  return (
    <div className="app-wrapper">
      <ErrorBoundary>
        {!isLoggedIn ? (
          <Login onLogin={handleLogin} />
        ) : (
          <div className="payment-page-wrapper">
            <TuitionPaymentForm initialData={userData} />
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}

export default App;
