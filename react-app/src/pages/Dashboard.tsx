import DashboardLayout from "@/components/layouts/ExampleLayout";
import { useUser } from "$${auth_client_package_name}/auth";

const Dashboard = () => {
  const user = useUser();

  return (
    <DashboardLayout>
      <div className="space-y-6">TODO: Add content here</div>
    </DashboardLayout>
  );
};

export default Dashboard;
