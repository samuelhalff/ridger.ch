"use client";
import {
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/src/components/navigation/NavigationComponents";
import { useTheme } from "next-themes";
import { Moon, Sun } from "@phosphor-icons/react";

function ListItem({
  children,
  onClick,
  isMobile,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isMobile?: boolean;
}) {
  return (
    <NavigationMenuLink
      asChild
      className={isMobile ? "text-xl" : "text-md"}
      onClick={onClick}
    >
      <button className="text-md cursor-pointer py-3 px-4 text-left w-full">
        {children}
      </button>
    </NavigationMenuLink>
  );
}

export default function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <NavigationMenuItem className="theme-toggle">
      <NavigationMenuTrigger className="theme-toggle-trigger flex items-center gap-1 px-2 min-w-[44px] justify-center">
        <Sun className="h-4 w-4 dark:hidden" aria-hidden="true" />
        <Moon className="h-4 w-4 hidden dark:block" aria-hidden="true" />
        <span className="sr-only">Toggle theme</span>
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ListItem onClick={() => setTheme("light")}>Light</ListItem>
        <ListItem onClick={() => setTheme("dark")}>Dark</ListItem>
        <ListItem onClick={() => setTheme("system")}>System</ListItem>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
