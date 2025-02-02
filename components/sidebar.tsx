import { Navigation } from "./navigation";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import { getCurrentUserTeamRoles, getUserTeams } from "@/lib/server/appwrite";

const Header = () => (
  <div className="flex flex-col justify-center lg:justify-start lg:flex-row gap-2 lg:gap-1 items-center mb-10">
    <Image src="/images/logo.svg" height={50} width={50} alt="Memlernado" />
    <p className="font-semibold text-xl">Memlernado</p>
  </div>
);

export const Sidebar = async () => {
  const teams = await getUserTeams();
  if (!teams?.total) return null;
  const roles = await getCurrentUserTeamRoles(teams.teams[0].$id);

  return (
    <aside className="h-screen p-4 bg-slate-100 w-64 min-w-64 hidden lg:block">
      <Header />
      <Navigation roles={roles || []} />
    </aside>
  );
};

export const MobileSideBar = async () => {
  const teams = await getUserTeams();
  if (!teams?.total) return null;
  const roles = await getCurrentUserTeamRoles(teams.teams[0].$id);

  return (
    <div className="block lg:hidden">
      <Sheet>
        <SheetTrigger className="px-4 h-16 ">
          <MenuIcon size={25} />
        </SheetTrigger>
        <SheetContent side={"left"} className="w-60 min-w-60 ">
          <SheetHeader>
            <Header />
          </SheetHeader>
          <Navigation roles={roles || []} />
        </SheetContent>
      </Sheet>
    </div>
  );
};
