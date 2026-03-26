import type { ReactNode } from "react";
import {
  Sidebar,
  type SidebarProps,
} from "../resource-panel";
import {
  TopNavigation,
  type TopNavigationProps,
} from "../ui/header/TopNavigation";
import { ResizableHandle } from "../weblab2/views";

interface Lab2ShellProps {
  children: ReactNode;
  onResize: (delta: number) => void;
  sidebarProps: SidebarProps;
  topNavigationProps?: TopNavigationProps;
}

export function Lab2Shell({
  children,
  onResize,
  sidebarProps,
  topNavigationProps,
}: Lab2ShellProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TopNavigation {...topNavigationProps} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar {...sidebarProps} />
        <ResizableHandle onResize={onResize} />
        {children}
      </div>
    </div>
  );
}
