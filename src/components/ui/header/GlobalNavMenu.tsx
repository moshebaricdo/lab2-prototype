import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useState } from "react";
import { AppButton } from "../AppButton";
import { AppNativeSelect } from "../AppDropdown";
import { FaIcon } from "../icons/FaIcon";
import {
  useTheme,
  type BrandTheme,
  type CodeAiActiveChromeVariant,
  type ThemeMode,
} from "../../../hooks/useTheme";
import styles from "./GlobalNavMenu.module.scss";
import navStyles from "./TopNavigation.module.scss";

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const BRAND_THEME_OPTIONS: Array<{ value: BrandTheme; label: string }> = [
  { value: "codeOrg", label: "Code.org" },
  { value: "codeAi", label: "CodeAI" },
];

const CODEAI_ACTIVE_CHROME_OPTIONS: Array<{
  value: CodeAiActiveChromeVariant;
  label: string;
}> = [
  { value: "neutral", label: "Neutral (black/white)" },
  { value: "info", label: "Info blue" },
  { value: "pink", label: "Accent pink" },
  { value: "purple", label: "Action purple" },
  { value: "success", label: "Success green" },
  { value: "successLight", label: "Success extra light" },
  { value: "darkBlue", label: "Dark blue (90/10)" },
];

export function GlobalNavMenu() {
  const {
    theme,
    setTheme,
    brandTheme,
    setBrandTheme,
    codeAiActiveChrome,
    setCodeAiActiveChrome,
  } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <AppButton
          variant="tertiary"
          tone="white"
          size="s"
          icon={<FaIcon name="bars" size="s" />}
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
              <p className={styles.label}>Brand</p>
              <AppNativeSelect
                value={brandTheme}
                onValueChange={(value) => setBrandTheme(value as BrandTheme)}
                options={BRAND_THEME_OPTIONS}
                placeholder=""
                size="s"
                tone="gray"
                fullWidth
              />
            </div>
            {brandTheme === "codeAi" ? (
              <div className={styles.field}>
                <p className={styles.label}>Active state</p>
                <AppNativeSelect
                  value={codeAiActiveChrome}
                  onValueChange={(value) =>
                    setCodeAiActiveChrome(value as CodeAiActiveChromeVariant)
                  }
                  options={CODEAI_ACTIVE_CHROME_OPTIONS}
                  placeholder=""
                  size="s"
                  tone="gray"
                  fullWidth
                />
              </div>
            ) : null}
            <div className={styles.field}>
              <p className={styles.label}>Theme</p>
              <AppNativeSelect
                value={theme}
                onValueChange={(value) => setTheme(value as ThemeMode)}
                options={THEME_OPTIONS}
                placeholder=""
                size="s"
                tone="gray"
                fullWidth
              />
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
