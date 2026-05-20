import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import { authActions } from "../store/authStore";
import { useAuthStore } from "../hooks/useAuthStore";

export function RegisterPage() {
  const navigate = useNavigate();
  const status = useAuthStore(s => s.status);
  const error = useAuthStore(s => s.error);
  const [form, setForm] = useState({ fullName: "", username: "", password: "", email: "", phone: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await authActions.register(form);
      navigate("/dashboard");
    } catch { /* error in store */ }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <LifeBuoy size={22} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-ink">Flood Rescue</span>
        </div>
        <h1 className="text-2xl font-semibold text-ink mb-1">Tạo tài khoản</h1>
        <p className="text-sm text-slate mb-8">Đăng ký tài khoản mới để gửi yêu cầu cứu hộ</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-md bg-semantic-error/10 text-semantic-error text-sm animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Họ và tên</label>
            <input className="input-field" placeholder="Nguyễn Văn A" value={form.fullName} onChange={set("fullName")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Username</label>
              <input className="input-field" placeholder="username" value={form.username} onChange={set("username")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Mật khẩu</label>
              <input type="password" className="input-field" placeholder="••••••" value={form.password} onChange={set("password")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
            <input type="email" className="input-field" placeholder="email@example.com" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Số điện thoại</label>
            <input className="input-field" placeholder="0901234567" value={form.phone} onChange={set("phone")} />
          </div>
          <button type="submit" disabled={status === "loading"} className="btn-primary w-full h-11">
            {status === "loading" ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
