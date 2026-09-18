"use client";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/src/components/navigation/NavigationComponents";
import LangSwitch from "@/src/components/navigation/LangSwitch";
import ThemeToggle from "@/src/components/navigation/ThemeToggle";

export default function HeaderControls() {
  return (
    <NavigationMenu viewport={false} style={{ zIndex: 10 }}>
      <NavigationMenuList className="text-md gap-1 space-x-0">
        <LangSwitch />
        <ThemeToggle />
      </NavigationMenuList>
    </NavigationMenu>
  );
}
