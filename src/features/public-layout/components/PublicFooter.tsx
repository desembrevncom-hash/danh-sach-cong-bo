import { Link } from "react-router-dom";

export function PublicFooter() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Col 1 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">Hệ thống tra cứu công bố sản phẩm</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Công cụ hỗ trợ tra cứu danh mục và trạng thái sản phẩm đang lưu hành tại Việt Nam thuộc HJCNT.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Danh mục</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/desembre" className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
                  Thương hiệu Desembre
                </Link>
              </li>
              <li>
                <Link to="/dermagarden" className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
                  Thương hiệu Dermagarden
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Đơn vị: HJCNT</li>
              <li>Email: info.hjcnt.vn@gmail.com</li>
              <li>Website: cong-bo.hjcnt.com.vn</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} HJCNT. All rights reserved.
          </p>
          {/* Admin link hidden visually but accessible */}
          <Link
            to="/admin/login"
            className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm p-1"
            title="Quản trị viên"
            aria-label="Đăng nhập quản trị"
          >
            ⚙ Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
