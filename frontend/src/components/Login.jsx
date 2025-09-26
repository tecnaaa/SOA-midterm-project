// frontend/src/Login.jsx
import { useState } from "react";
import "../styles/Login.css";

import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 const handleSubmit = (e) => {
  e.preventDefault();

  Swal.fire({
    icon: "info", // có thể là "success", "error", "warning", "question"
    title: "Thông tin đăng nhập",
    html: `<p><b>Email:</b> ${email}</p>
           <p><b>Password:</b> ${password}</p>`,
    confirmButtonText: "OK"
  });
};


  return (
    <div className="login-page">

      {/* Form login */}
      <div className="login-box">
        <h1>StudentPay💳</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <a href="#" className="forgot">Forgot Password?</a>
          </div>

          <div className="remember">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember Me</label>
          </div>

          <button type="submit" className="btn-login">Login</button>

          <p className="register-text">
            Don’t have an Account? <a href="#">Register</a>
          </p>
        </form>
      </div>
    </div>
  );
} 