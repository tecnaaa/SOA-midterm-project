// frontend/src/Login.jsx
import { useState } from "react";
import "./Login.css"; // import file CSS riêng

import Swal from "sweetalert2";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Giả lập kiểm tra thông tin đăng nhập
    const validEmail = "student@example.com";
    const validPassword = "123";

    if (email === validEmail && password === validPassword) {
      const userData = {
        fullName: "Student Example",
        email,
        availableBalance: 50000000,
      };

      if (onLogin) {
        onLogin(userData);
      }

      await Swal.fire({
        icon: "success",
        title: "Đăng nhập thành công!",
        text: "Bạn đã vào form payment.",
        confirmButtonText: "OK"
      });
    } else {
      await Swal.fire({
        icon: "error",
        title: "Đăng nhập thất bại!",
        text: "Sai thông tin đăng nhập. Vui lòng thử lại.",
        confirmButtonText: "Thử lại"
      });
      setPassword(""); // Xóa password để nhập lại
    }
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