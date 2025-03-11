"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";


import { useSession } from "next-auth/react";
import LeftMenu from "@/components/ui/LeftMenu";
import TopMenu from "@/components/ui/TopMenu";



export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  
  const { data: session, status } = useSession();
  const router = useRouter();


  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  }

  if (status === "unauthenticated") {
    router.push('/login');
  }

  // if (status === "authenticated") {
  //   if (session?.user.id) {
  //     getAdminInfo(session?.user.id).then((admin) => {
  //       setUser(admin);
  //     });
  //   }
  // }



  return (
    <div className="min-h-screen bg-background">
      {/* Left Sidebar Navigation */}
      <LeftMenu />
      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        {/* Top Navigation Bar */}
        <TopMenu userSession={session?.user} />

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}