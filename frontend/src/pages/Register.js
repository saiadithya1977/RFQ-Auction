import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "SUPPLIER",
    });

    const navigate = useNavigate();

    const handleSubmit = async () => {
        try {
            await API.post("/auth/register", form);
            navigate("/");
        } catch (err) {
            alert("Error registering");
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <h2>Register</h2>

                <input
                    placeholder="Name"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <input
                    placeholder="Email"
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />

                <select
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                    <option value="SUPPLIER">Supplier</option>
                    <option value="BUYER">Buyer</option>
                </select>

                <button onClick={handleSubmit}>Register</button>

                <p className="auth-link" onClick={() => navigate("/")}>
                    Already have account? Login
                </p>
            </div>
        </div>
    );
}