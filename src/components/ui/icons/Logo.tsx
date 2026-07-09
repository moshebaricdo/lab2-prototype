import codeAiLogoUrl from "../../../assets/logo/codeai-logo-wide.svg";

export function Logo() {
  return (
    <img
      src={codeAiLogoUrl}
      alt=""
      className="block size-full object-contain"
      draggable={false}
    />
  );
}
