import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6 text-center">
          <h1 className="text-xl md:text-2xl font-semibold tracking-wider uppercase text-primary">
            Hệ thống tra cứu công bố sản phẩm
          </h1>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* DESEMBRE CARD */}
          <Link 
            to="/desembre"
            className="group relative flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-widest text-foreground group-hover:scale-105 transition-transform duration-300">
              DESEMBRE
            </h2>
            <p className="mt-4 text-muted-foreground text-sm uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
              Vào xem danh mục
            </p>
          </Link>

          {/* DERMAGARDEN CARD */}
          <Link 
            to="/dermagarden"
            className="group relative flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-widest text-foreground group-hover:scale-105 transition-transform duration-300 text-center">
              DERMAGARDEN
            </h2>
            <p className="mt-4 text-muted-foreground text-sm uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
              Vào xem danh mục
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
