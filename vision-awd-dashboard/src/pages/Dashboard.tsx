import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardContent from "@/components/dashboard/DashboardContent";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <DashboardContent />
    </div>
  );
};

export default Dashboard;
