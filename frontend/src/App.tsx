import MyProvider from "./context/MyProvider.tsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth_page/login/LoginPage.tsx";
import PasswordResetPage from "./pages/auth_page/login/PasswordResetPage.tsx";
import RegistrationPage from "./pages/auth_page/signup/RegistrationPage.tsx";
import EmailConfirmationPage from "./pages/auth_page/signup/EmailComfirmationPage.tsx";
import HomePage from "./pages/home_page/HomePage.tsx";
import CallbackPage from "./pages/auth_page/callback/CallbackPage.tsx";
import { StyledEngineProvider } from '@mui/material/styles';
import ProtectedRoute from "./pages/auth_page/callback/ProtectedRoute.tsx";

function App() {
    const darkPreference:boolean = window.matchMedia('(prefers-color-scheme: dark)').matches;

    return (
    <StyledEngineProvider injectFirst>
        <MyProvider >
            <Router basename="/" >
                <Routes>
                    <Route path="/" element={<LoginPage darkMode={darkPreference}/>} />
                    <Route path="/login" element={<LoginPage darkMode={darkPreference}/>} />
                    <Route path="/signup" element={<RegistrationPage darkMode={darkPreference}/>} />
                    <Route path="/passwordreset" element={<PasswordResetPage darkMode={darkPreference}/>} />
                    <Route path="/verification" element={<EmailConfirmationPage darkMode={darkPreference}/>} />
                    <Route path="/callback" element={<CallbackPage/>} />
                    <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>}/>
                </Routes>
            </Router>
        </MyProvider>
    </StyledEngineProvider >
  )
}

export default App
