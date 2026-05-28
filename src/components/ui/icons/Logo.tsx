import svgPaths from "../../../imports/svg-lnv1h8eepy";
import { useTheme, type BrandTheme } from "../../../hooks/useTheme";
import codeAiLogoUrl from "../../../assets/logo/codeai-logo-wide.svg";

interface LogoProps {
  brandTheme?: BrandTheme;
}

const LOGO_FILLS: Record<BrandTheme, string[]> = {
  codeOrg: [
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
  ],
  codeAi: [
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
    "var(--ds-text-neutral-white-fixed)",
  ],
};

export function Logo({ brandTheme: brandThemeOverride }: LogoProps) {
  const { brandTheme } = useTheme();
  const resolvedBrandTheme = brandThemeOverride ?? brandTheme;
  const fills = LOGO_FILLS[resolvedBrandTheme];

  if (resolvedBrandTheme === "codeAi") {
    return (
      <img
        src={codeAiLogoUrl}
        alt=""
        className="block size-full object-contain"
        draggable={false}
      />
    );
  }

  return (
    <svg
      className="block size-full"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 32 32"
    >
      <g id="Layer_1-2">
        <path d={svgPaths.p30ede580} fill={fills[0]} id="Vector" />
        <path
          d={svgPaths.p36ccd9f0}
          fill={fills[1]}
          id="Vector_2"
        />
        <path
          d={svgPaths.p2d0807f0}
          fill={fills[2]}
          id="Vector_3"
        />
        <path
          d={svgPaths.p35b99500}
          fill={fills[3]}
          id="Vector_4"
        />
        <path
          d={svgPaths.p3c60a080}
          fill={fills[4]}
          id="Vector_5"
        />
        <path
          d={svgPaths.p16b30100}
          fill={fills[5]}
          id="Vector_6"
        />
      </g>
    </svg>
  );
}
