import type { ReactNode } from "react";
import { useState } from "react";
import {
  Sidebar,
  type SidebarProps,
} from "../resource-panel";
import {
  TopNavigation,
  type TopNavigationProps,
} from "../ui/header/TopNavigation";
import { ResizableHandle } from "../weblab2/views";

type Lab2ShellProps =
  | {
      children: ReactNode;
      topNavigationProps?: TopNavigationProps;
      /** No resource panel (e.g. bubble choice levels). */
      hideResourcePanel: true;
    }
  | {
      children: ReactNode;
      onResize: (delta: number) => void;
      sidebarProps: SidebarProps;
      topNavigationProps?: TopNavigationProps;
      hideResourcePanel?: false;
    };

export function Lab2Shell(props: Lab2ShellProps) {
  const { children, topNavigationProps } = props;

  if (props.hideResourcePanel === true) {
    return (
      <div className="relative flex h-screen flex-col overflow-hidden bg-background">
        <TopNavigation {...topNavigationProps} />
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  const { onResize, sidebarProps } = props;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    Boolean(sidebarProps.collapsible),
  );
  const resizeDisabled =
    Boolean(sidebarProps.collapsible) && sidebarCollapsed;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      <TopNavigation {...topNavigationProps} />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar
          {...sidebarProps}
          onCollapsedChange={(collapsed) => {
            setSidebarCollapsed(collapsed);
            sidebarProps.onCollapsedChange?.(collapsed);
          }}
        />
        {!resizeDisabled && <ResizableHandle onResize={onResize} />}
        {children}
      </div>
    </div>
  );
}
