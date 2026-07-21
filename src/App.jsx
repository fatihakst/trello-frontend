import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

// Korumalı Rota Kontrolü (Token yoksa Login'e atar)
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                                <h1>Projelerim (Dashboard)</h1>
                                <p>Giriş başarılı! Burada projeler listelenecek.</p>
                                <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>
                                    Çıkış Yap
                                </button>
                            </div>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;