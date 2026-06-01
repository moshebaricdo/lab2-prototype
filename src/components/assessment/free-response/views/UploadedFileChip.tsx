import { useEffect, useMemo, useState } from "react";
import { FileChip } from "../../../ui/FileChip";
import { getFileChipIconProps, fileExtensionLabelFromName } from "../../../ui/fileChipMeta";

function canPreviewImageInBrowser(file: File): boolean {
  const t = file.type.toLowerCase();
  return (
    t === "image/png" ||
    t === "image/jpeg" ||
    t === "image/gif" ||
    t === "image/webp" ||
    t === "image/svg+xml"
  );
}

interface UploadedFileChipProps {
  file: File;
  disabled?: boolean;
  onRemove: () => void;
}

export function UploadedFileChip({
  file,
  disabled,
  onRemove,
}: UploadedFileChipProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const showImageThumb = canPreviewImageInBrowser(file) && !previewFailed;

  const imageUrl = useMemo(() => {
    if (!showImageThumb) return null;
    return URL.createObjectURL(file);
  }, [file, showImageThumb]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const extension = fileExtensionLabelFromName(file.name);
  const fileIcon = getFileChipIconProps(file.name);

  return (
    <FileChip
      fileName={file.name}
      extensionLabel={extension}
      iconName={fileIcon.iconName}
      iconFamily={fileIcon.iconFamily}
      onRemove={onRemove}
      disabled={disabled}
      imageSrc={showImageThumb && imageUrl ? imageUrl : null}
      onImageError={() => setPreviewFailed(true)}
    />
  );
}
