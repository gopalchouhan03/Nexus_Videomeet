import * as React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, Alert } from '@mui/material';
import { AuthLayout } from '../components/layouts/index';
import { Button, Input } from '../components/common/index';
import { VisibilityIcon, VisibilityOffIcon } from '../icons/index';
import '../styles/auth-new.css';

export default function Authentication() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState('');
    const [errorDetails, setErrorDetails] = React.useState([]);
    const [message, setMessage] = React.useState('');
    const [formState, setFormState] = React.useState(0); // 0: Login, 1: Signup
    const [open, setOpen] = React.useState(false);
    const [errorOpen, setErrorOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        setLoading(true);
        try {
            if (formState === 0) {
                // Login
                await handleLogin(username, password);
                setError('');
                setErrorDetails([]);
                setErrorOpen(false);
            } else {
                // Signup
                const result = await handleRegister(name, username, password);
                setMessage(result);
                setOpen(true);
                setUsername('');
                setPassword('');
                setName('');
                setError('');
                setErrorDetails([]);
                setErrorOpen(false);
                setFormState(0);
            }
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'An error occurred';
            const errors = err?.response?.data?.errors || [];

            setError(errorMsg);
            setErrorDetails(errors);
            setErrorOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAuth();
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-wrapper">
                {/* Header */}
                <div className="auth-form-header">
                    <h2 className="auth-form-title">
                        {formState === 0 ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="auth-form-subtitle">
                        {formState === 0
                            ? 'Sign in to continue to NEXUS'
                            : 'Join NEXUS to connect with your team'}
                    </p>
                </div>

                {/* Form */}
                <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleAuth(); }}>
                    {/* Name Field (Signup only) */}
                    {formState === 1 && (
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            size="md"
                        />
                    )}

                    {/* Username/Email Field */}
                    <Input
                        label={formState === 0 ? 'Username' : 'Username'}
                        type="text"
                        placeholder="john_doe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        size="md"
                    />

                    {/* Password Field */}
                    <div className="password-field">
                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            size="md"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="auth-error-box">
                            <p className="auth-error-title">{error}</p>
                            {errorDetails.length > 0 && (
                                <ul className="auth-error-list">
                                    {errorDetails.map((err, idx) => (
                                        <li key={idx}>
                                            <strong>{err.field}:</strong> {err.message}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleAuth}
                        disabled={loading}
                        loading={loading}
                    >
                        {loading
                            ? formState === 0
                                ? 'Signing in...'
                                : 'Creating account...'
                            : formState === 0
                            ? 'Sign In'
                            : 'Create Account'}
                    </Button>

                    {/* Form Toggle */}
                    <div className="auth-toggle">
                        <span className="auth-toggle-text">
                            {formState === 0
                                ? "Don't have an account? "
                                : 'Already have an account? '}
                        </span>
                        <button
                            type="button"
                            className="auth-toggle-button"
                            onClick={() => {
                                setFormState(formState === 0 ? 1 : 0);
                                setError('');
                                setErrorDetails([]);
                                setErrorOpen(false);
                                setName('');
                                setUsername('');
                                setPassword('');
                            }}
                        >
                            {formState === 0 ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="auth-form-footer">
                    <p className="auth-footer-text">
                        {formState === 1
                            ? 'No credit card required. Start free.'
                            : "Don't have an account? "}
                        {formState === 0 && (
                            <button
                                type="button"
                                className="auth-footer-link"
                                onClick={() => setFormState(1)}
                            >
                                Get started
                            </button>
                        )}
                    </p>
                </div>
            </div>

            {/* Success Notification */}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="success">{message}</Alert>
            </Snackbar>

            {/* Error Notification */}
            <Snackbar
                open={errorOpen}
                autoHideDuration={6000}
                onClose={() => setErrorOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setErrorOpen(false)} sx={{ width: '100%' }}>
                    <div>
                        <strong>{error}</strong>
                        {errorDetails.length > 0 && (
                            <ul style={{ margin: '8px 0 0 20px', paddingLeft: '0' }}>
                                {errorDetails.map((err, idx) => (
                                    <li key={idx} style={{ marginTop: '4px' }}>
                                        <strong>{err.field}:</strong> {err.message}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Alert>
            </Snackbar>
        </AuthLayout>
    );
}