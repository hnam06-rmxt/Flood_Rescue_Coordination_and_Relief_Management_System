import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LifeBuoy, Eye, EyeOff } from "lucide-react";
import { authActions } from "../store/authStore";
import { useAuthStore } from "../hooks/useAuthStore";

export function LoginPage() {
  const navigate = useNavigate();
  const status = useAuthStore(s => s.status);
  const error = useAuthStore(s => s.error);
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await authActions.login(form);
      navigate("/dashboard");
    } catch { /* error is in store */ }
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left - Branding Panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-brand-navy text-on-dark flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-white">
              <LifeBuoy size={22} />
            </div>
            <span className="text-lg font-semibold tracking-tight">Flood Rescue</span>
          </div>
          <h2 className="heading-1 !text-4xl text-white leading-tight mb-6">
            Hệ thống<br />Điều phối Cứu hộ
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-sm font-medium">
            Quản lý tập trung hoạt động cứu hộ, tiếp nhận yêu cầu và điều phối lực lượng ứng cứu nhanh chóng.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Cứu hộ", "Điều phối", "Bản đồ", "Cảnh báo"].map(t => (
            <span key={t} className="px-3 py-1 rounded-md border border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider">{t}</span>
          ))}
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <LifeBuoy size={22} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-ink">Flood Rescue</span>
          </div>

          <h1 className="text-2xl font-semibold text-ink mb-1">Đăng nhập</h1>
          <p className="text-sm text-slate mb-8">Sử dụng tài khoản để truy cập hệ thống</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-md bg-semantic-error/10 text-semantic-error text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Tên đăng nhập</label>
              <input type="text" className="input-field" placeholder="admin" autoFocus
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} className="input-field pr-10" placeholder="••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={status === "loading"}
              className="btn-primary w-full h-11">
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">Đăng ký</Link>
          </p>

          {/* Quick login hints */}
          <div className="mt-8 p-4 rounded-lg bg-surface border border-hairline">
            <p className="text-xs font-medium text-slate mb-2">Điền nhanh tài khoản test:</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={() => setForm({ username: "admin", password: "admin123" })} className="px-2 py-1 bg-white border border-hairline rounded hover:bg-surface-soft hover:border-primary text-ink transition-colors">Admin</button>
              <button type="button" onClick={() => setForm({ username: "Manager", password: "demo123" })} className="px-2 py-1 bg-white border border-hairline rounded hover:bg-surface-soft hover:border-primary text-ink transition-colors">Manager</button>
              <button type="button" onClick={() => setForm({ username: "citizen", password: "123456" })} className="px-2 py-1 bg-white border border-hairline rounded hover:bg-surface-soft hover:border-primary text-ink transition-colors">Citizen</button>
              <button type="button" onClick={() => setForm({ username: "RescueTeam", password: "123456" })} className="px-2 py-1 bg-white border border-hairline rounded hover:bg-surface-soft hover:border-primary text-ink transition-colors">RescueTeam</button>
              <button type="button" onClick={() => setForm({ username: "Coordinator", password: "123456" })} className="px-2 py-1 bg-white border border-hairline rounded hover:bg-surface-soft hover:border-primary text-ink transition-colors">Coordinator</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
