// frontend/src/Login.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";
import Swal from "sweetalert2";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(username, password);
      
      await Swal.fire({
        icon: "success",
        title: "Đăng nhập thành công!",
        text: "Bạn đã vào iBanking.",
        confirmButtonText: "OK"
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Đăng nhập thất bại!",
        text: error.message,
        confirmButtonText: "Thử lại"
      });
      setPassword(""); // Xóa password để nhập lại
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>iBanking💳</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="remember">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Ghi nhớ</label>
          </div>

          <button type="submit" className="btn-login">Đăng nhập</button>
        </form>
      </div>
    </div>
  );
}