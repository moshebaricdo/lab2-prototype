import { useEffect, useRef, useState, type DragEvent } from "react";
import { Alert, Button, Modal, TextInput } from "@moshebari/cads-react";
import type {
  AiLabDataset,
  AiLabUploadedDatasetMetadata,
} from "../../../../types/aiLab";
import { FaIcon } from "../../../ui/icons/FaIcon";
import styles from "./DatasetMetadataModal.module.scss";

const MAX_COVER_WIDTH = 640;
const MAX_COVER_HEIGHT = 480;
const MAX_IMAGE_FILE_BYTES = 8 * 1024 * 1024;

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image."));
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

async function readCoverImageDataUrl(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  if (
    file.type === "image/svg+xml" ||
    file.name.toLowerCase().endsWith(".svg") ||
    typeof document === "undefined"
  ) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image;
      if (!width || !height || (width <= MAX_COVER_WIDTH && height <= MAX_COVER_HEIGHT)) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.min(MAX_COVER_WIDTH / width, MAX_COVER_HEIGHT / height);
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function authoredDescription(dataset: AiLabDataset): string {
  if (dataset.card?.description) return dataset.card.description;
  if (dataset.description.startsWith("Imported CSV")) return "";
  return dataset.description;
}

export interface DatasetMetadataModalProps {
  open: boolean;
  dataset: AiLabDataset;
  fileName: string;
  metadata?: AiLabUploadedDatasetMetadata;
  onSave: (metadata: AiLabUploadedDatasetMetadata) => void;
  onClose: () => void;
}

export function DatasetMetadataModal({
  open,
  dataset,
  fileName,
  metadata,
  onSave,
  onClose,
}: DatasetMetadataModalProps) {
  const [name, setName] = useState(metadata?.name ?? dataset.name);
  const [cover, setCover] = useState<string | undefined>(
    metadata?.cover ?? dataset.cover,
  );
  const [description, setDescription] = useState(
    metadata?.description ?? authoredDescription(dataset),
  );
  const [potentialUses, setPotentialUses] = useState(
    metadata?.potentialUses ?? dataset.card?.potentialUses ?? "",
  );
  const [potentialMisuses, setPotentialMisuses] = useState(
    metadata?.potentialMisuses ?? dataset.card?.potentialMisuses ?? "",
  );
  const [source, setSource] = useState(
    metadata?.source ?? dataset.card?.source ?? "",
  );
  const [imageError, setImageError] = useState<string | undefined>();
  const [isDragOver, setIsDragOver] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(metadata?.name ?? dataset.name);
    setCover(metadata?.cover ?? dataset.cover);
    setDescription(metadata?.description ?? authoredDescription(dataset));
    setPotentialUses(
      metadata?.potentialUses ?? dataset.card?.potentialUses ?? "",
    );
    setPotentialMisuses(
      metadata?.potentialMisuses ?? dataset.card?.potentialMisuses ?? "",
    );
    setSource(metadata?.source ?? dataset.card?.source ?? "");
    setImageError(undefined);
    setIsDragOver(false);
  }, [open, dataset, metadata]);

  const ingestCoverFile = (file: File | undefined) => {
    if (!file) return;
    if (!isImageFile(file)) {
      setImageError("Choose a PNG, JPG, WebP, GIF, or SVG image.");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      setImageError("Choose an image smaller than 8 MB.");
      return;
    }
    setImageError(undefined);
    void readCoverImageDataUrl(file)
      .then((url) => {
        setCover(url);
      })
      .catch(() => {
        setImageError("That image could not be read. Try another file.");
      });
  };

  const onDropImage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    ingestCoverFile(event.dataTransfer.files?.[0]);
  };

  const handleSave = () => {
    onSave({
      name: name.trim() || undefined,
      cover: cover?.trim() || undefined,
      description: description.trim() || undefined,
      potentialUses: potentialUses.trim() || undefined,
      potentialMisuses: potentialMisuses.trim() || undefined,
      source: source.trim() || undefined,
    });
    onClose();
  };

  const rowCount = dataset.rowCount ?? dataset.rows.length;
  const colCount = dataset.columnCount ?? dataset.columns.length;

  return (
    <Modal
      open={open}
      title="Edit dataset details"
      maxWidth={560}
      isDismissable
      hasSecondaryAction
      primaryActionLabel="Save"
      secondaryActionLabel="Cancel"
      onPrimaryAction={handleSave}
      onSecondaryAction={onClose}
      onClose={onClose}
    >
      <div className={styles.body}>
        <div className={styles.coverSection}>
          <div
            className={`${styles.coverPreview} ${
              isDragOver ? styles.coverPreviewDragOver : ""
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (
                event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              ) {
                return;
              }
              setIsDragOver(false);
            }}
            onDrop={onDropImage}
          >
            {cover ? (
              <img className={styles.coverImage} src={cover} alt="" />
            ) : (
              <span className={styles.coverPlaceholder} aria-hidden>
                <FaIcon name="table" size="inherit" />
              </span>
            )}
          </div>
          <div className={styles.coverControls}>
            <div className={styles.coverCopy}>
              <span className={styles.coverLabel}>Cover image</span>
              <span className={styles.coverHint}>
                Shown on the dataset card in the chooser. Drag an image here or
                upload a file.
              </span>
            </div>
            <div className={styles.coverActions}>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                startIconName="image"
                onClick={() => imageInputRef.current?.click()}
              >
                {cover ? "Change image" : "Upload image"}
              </Button>
              {cover ? (
                <Button
                  variant="text"
                  color="secondary"
                  size="extraSmall"
                  startIconName="trash"
                  onClick={() => {
                    setCover(undefined);
                    setImageError(undefined);
                  }}
                >
                  Remove
                </Button>
              ) : null}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className={styles.fileInput}
                tabIndex={-1}
                aria-label="Upload cover image"
                onChange={(event) => {
                  ingestCoverFile(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </div>
          </div>
        </div>

        {imageError ? (
          <Alert sentiment="error" size="small">
            {imageError}
          </Alert>
        ) : null}

        <TextInput
          label="Dataset name"
          size="small"
          color="secondary"
          value={name}
          placeholder={fileName.replace(/\.csv$/i, "")}
          helperText={`${fileName} · ${rowCount.toLocaleString()} rows · ${colCount} columns`}
          onChange={(event) => setName(event.target.value)}
        />

        <TextInput
          multiline
          rows={3}
          label="Description"
          size="small"
          color="secondary"
          value={description}
          placeholder="What is in this dataset, and what does each row represent?"
          onChange={(event) => setDescription(event.target.value)}
        />

        <TextInput
          multiline
          rows={2}
          label="Potential uses"
          size="small"
          color="secondary"
          value={potentialUses}
          placeholder="What questions or predictions is this dataset useful for?"
          onChange={(event) => setPotentialUses(event.target.value)}
        />

        <TextInput
          multiline
          rows={2}
          label="Potential misuses"
          size="small"
          color="secondary"
          value={potentialMisuses}
          placeholder="What limitations, gaps, or biases should people watch out for?"
          onChange={(event) => setPotentialMisuses(event.target.value)}
        />

        <TextInput
          label="Source (optional)"
          size="small"
          color="secondary"
          value={source}
          placeholder="Where did this data come from? (e.g. URL or organization)"
          onChange={(event) => setSource(event.target.value)}
        />
      </div>
    </Modal>
  );
}
