import { AppTextArea, type AppTextAreaProps } from "./AppTextField";

function Textarea({ appearance = "field", ...props }: AppTextAreaProps) {
  return <AppTextArea appearance={appearance} {...props} />;
}

export { Textarea };
