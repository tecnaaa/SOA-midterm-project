import React from 'react';
import Login from './components/Login';
import TuitionPaymentForm from './components/TuitionPaymentForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Login />;
  }
  return children;
};

const AppContent = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Login />;
  }
  
  return <TuitionPaymentForm initialData={user} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
