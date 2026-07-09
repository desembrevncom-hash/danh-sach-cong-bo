import { useEditUnlock } from "@/features/edit-unlock/hooks/useEditUnlock";
import { Link } from "react-router-dom";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked?: () => void; // kept for compatibility but it won't be called directly by password
};

const UnlockDialog = ({ open, onOpenChange }: Props) => {
  const { isAdmin } = useEditUnlock();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm z-10 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
        <h3 className="font-bold text-lg text-center">Yêu cầu quyền Admin</h3>
        
        <p className="text-sm text-muted-foreground text-center">
          Tài khoản hiện tại không có quyền chỉnh sửa. Vui lòng đăng nhập tài khoản admin.
        </p>
        
        <div className="flex flex-col gap-2 mt-2">
          {!isAdmin && (
            <Link 
              to="/admin/login"
              className="w-full flex items-center justify-center h-10 px-4 bg-primary text-primary-foreground font-medium text-sm rounded-md hover:bg-primary/90 transition-colors"
            >
              Đăng nhập Admin
            </Link>
          )}
          <button 
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full h-10 px-4 font-medium text-sm rounded-md border border-input hover:bg-muted transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlockDialog;
