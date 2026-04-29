import { Outlet } from "react-router";
import { FloatingTicketWidget } from "../ui/FloatingTicketWidget";

export function MainLayout() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="flex-1 relative">
        <Outlet />
      </div>
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <FloatingTicketWidget />
      </div>
    </div>
  );
}
