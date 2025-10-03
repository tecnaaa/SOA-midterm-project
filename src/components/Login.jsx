// frontend/src/Login.jsx
import { useState } from "react";
import "./Login.css";
import Swal from "sweetalert2";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", { // đổi URL nếu cần
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        const user = data.user;

        // gọi callback onLogin
        if (onLogin) onLogin(user);

        // lưu localStorage
        localStorage.setItem("user", JSON.stringify(user));

        await Swal.fire({
          icon: "success",
          title: "Đăng nhập thành công!",
          text: `Xin chào ${user.fullName}`,
          confirmButtonText: "OK",
        });

        setEmail("");
        setPassword("");
      } else {
        await Swal.fire({
          icon: "error",
          title: "Đăng nhập thất bại!",
          text: data.message || "Email hoặc mật khẩu không chính xác.",
          confirmButtonText: "Thử lại",
        });
        setPassword("");
      }
    } catch (err) {
      console.error("Login error:", err);
      await Swal.fire({
        icon: "error",
        title: "Lỗi server",
        text: "Không thể kết nối backend. Vui lòng thử lại sau.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
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

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
