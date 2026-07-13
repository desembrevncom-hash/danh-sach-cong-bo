import { Link } from "react-router-dom";

export function CatalogFooter() {
  return (
    <footer className="footer-gradient mt-10">
      <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p className="text-sm md:text-base font-semibold tracking-[0.2em] text-primary-foreground">
          www.desembrevn.com
        </p>
        <div className="md:text-right">
          <p className="elegant-title text-xl md:text-2xl text-primary-foreground leading-tight">
            List of Desembre
          </p>
          <p className="elegant-title text-2xl md:text-3xl text-accent font-semibold tracking-wide">
            PRODUCTS 2026
          </p>
        </div>
      </div>
      {/* Liên kết Admin ẩn — chỉ hiện khi hover */}
      <div className="text-center pb-3">
        <Link
          to="/admin/login"
          className="text-[10px] text-primary-foreground/20 hover:text-primary-foreground/60 transition-colors duration-300 select-none"
          title="Quản trị viên"
          aria-label="Đăng nhập quản trị"
        >
          ⚙
        </Link>
      </div>
    </footer>
  );
}
