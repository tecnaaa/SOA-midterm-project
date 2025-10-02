// frontend/src/Login.jsx
import { useState } from "react";
import "./Login.css";
import users from "../../backend/database/users.json";
import Swal from "sweetalert2";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password });

    const user = users.find((u) => u.email === email && u.password === password);
    console.log("Found user:", user);

    if (user) {
      console.log("Calling onLogin with:", user);
      if (onLogin) {
        onLogin({
          userID: user.userID,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          username: user.username,
        });
      }
      localStorage.setItem("user", JSON.stringify(user));
      await Swal.fire({
        icon: "success",
        title: "Đăng nhập thành công!",
        text: `Xin chào ${user.fullName}.`,
        confirmButtonText: "OK",
      });
    } else {
      await Swal.fire({
        icon: "error",
        title: "Đăng nhập thất bại!",
        text: "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.",
        confirmButtonText: "Thử lại",
      });
      setPassword("");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>iBanking💳</h1>
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
          </div>

          <div className="remember">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember Me</label>
          </div>

          <button type="submit" className="btn-login">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}