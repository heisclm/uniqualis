import { headers } from "next/headers";
import { DashboardLayout } from "@/components/DashboardLayout";

export default async function Home() {
  const reqHeaders = await headers();
  const userRole = reqHeaders.get('x-user-role') || 'STUDENT';

  return <DashboardLayout userRole={userRole} />;
}
