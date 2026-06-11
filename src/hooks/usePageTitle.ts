import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageTitleForPath } from "../lib/pageTitles";

export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getPageTitleForPath(pathname);
  }, [pathname]);
}
