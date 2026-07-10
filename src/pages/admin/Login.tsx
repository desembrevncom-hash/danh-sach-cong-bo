import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Kiểm tra nếu đã login thì chuyển hướng luôn
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Kiểm tra quyền admin
        supabase.from("profiles").select("role").eq("user_id", session.user.id).maybeSingle()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error("[Login] Fetch profile error", error);
              // Don't sign out on network error
              return;
            }
            if (profile?.role === "admin") {
              navigate("/admin/dashboard", { replace: true });
            } else {
              supabase.auth.signOut();
            }
          });
      }
    });
  }, [navigate]);

  const handleClearCache = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Bọc signInWithPassword trong 1 Promise.race để chống treo vĩnh viễn
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 15000));
      
      const { data, error: signInError } = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        timeoutPromise
      ]);

      if (signInError) {
        setError("Email hoặc mật khẩu không đúng.");
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        supabase.auth.signOut();
        setError("Không xác định được tài khoản đăng nhập.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("[admin-login] Failed to fetch role", profileError);
        supabase.auth.signOut();
        setError("Không thể xác minh quyền admin. Vui lòng kiểm tra profile role.");
        return;
      }

      if (!profile || profile.role !== "admin") {
        supabase.auth.signOut();
        setError("Bạn không có quyền truy cập trang này.");
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err: unknown) {
      console.error("[admin-login] Unexpected error", err);
      if (err instanceof Error && err.message === "TIMEOUT") {
        setError("Kết nối máy chủ quá hạn. Trình duyệt của bạn có thể đang bị kẹt bộ nhớ. Vui lòng bấm nút 'Xóa bộ nhớ đệm' bên dưới.");
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
      supabase.auth.signOut().catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Quản trị viên</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Đăng nhập để vào trang quản lý hệ thống
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none text-foreground"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2"
          >
            {isLoading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>

        {/* Hiệu ứng Von Restorff cô lập lỗi màu đỏ */}
        {error && (
          <div className="mt-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center animate-in fade-in zoom-in-95 duration-300">
            {error === "Invalid login credentials" 
              ? "Email hoặc mật khẩu không chính xác." 
              : error}
            
            {error.includes("kẹt bộ nhớ") && (
              <button 
                type="button"
                onClick={handleClearCache}
                className="mt-3 block w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-semibold hover:bg-destructive/90 transition-colors"
              >
                Xóa bộ nhớ đệm & Tải lại trang
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
