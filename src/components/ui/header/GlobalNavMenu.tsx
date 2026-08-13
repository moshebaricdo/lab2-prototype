import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useState } from "react";
import { Button, Dropdown } from "@moshebaricdo/cads-react";
import { useTheme, type ThemeMode } from "../../../hooks/useTheme";
import styles from "./GlobalNavMenu.module.scss";
import navStyles from "./TopNavigation.module.scss";

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function GlobalNavMenu() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="text"
          color="tertiary"
          size="extraSmall"
          iconOnly
          startIconName="bars"
          className={navStyles.rightIconButton}
          aria-label="Menu"
          aria-haspopup="dialog"
          aria-expanded={open}
        />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={styles.content}
          align="end"
          side="bottom"
          sideOffset={4}
        >
          <div className={styles.panel} role="group" aria-label="Appearance">
            <div className={styles.field}>
              <p className={styles.label}>Theme</p>
              <Dropdown
                role="input"
                size="small"
                color="secondary"
                width="full"
                value={theme}
                options={THEME_OPTIONS}
                onChange={(value) => setTheme(String(value) as ThemeMode)}
                aria-label="Theme"
              />
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
