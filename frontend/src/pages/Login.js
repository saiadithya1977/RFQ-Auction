import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await API.post("/auth/login", { email, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", res.data.role);
            navigate("/rfqs");
        } catch {
            alert("Invalid credentials");
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <h2>Login</h2>

                <input
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={handleLogin}>Login</button>

                <p className="auth-link" onClick={() => navigate("/register")}>
                    New user? Register
                </p>
            </div>
        </div>
    );
}