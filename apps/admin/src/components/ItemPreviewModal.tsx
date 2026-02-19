import { FileText, Image as ImageIcon, Music, Pause, Play, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { CatalogItem, ItemType } from "@bizu/shared";
import { getPublicFileUrl } from "../lib/catalogApi";
import { Modal } from "./ui";

type ItemPreviewModalProps = {
  item: CatalogItem | null;
  onClose: () => void;
};

export function ItemPreviewModal({ item, onClose }: ItemPreviewModalProps) {
  if (!item) return null;

  const mediaUrl = item.type !== "text" && item.storage_path ? getPublicFileUrl(item.storage_path) : null;
  const audioLyrics = resolveAudioLyrics(item);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    setIsFavorited(false);
    setIsAudioPlaying(false);
  }, [item.id]);

  return (
    <Modal
      open={Boolean(item)}
      title={`Pré-visualização: ${item.title}`}
      onClose={onClose}
      width="lg"
      footer={null}
    >
      <div className="mobile-preview-shell">
        <div className="mobile-preview-screen">
          <div className="mobile-preview-top-actions">
            <button type="button" className="mobile-preview-favorite" onClick={() => setIsFavorited((prev) => !prev)}>
              <Star size={17} className={isFavorited ? "is-favorited" : ""} />
              <span>{isFavorited ? "Favoritado" : "Favoritar"}</span>
            </button>
          </div>

          {item.type !== "text" ? <PreviewPlaceholder type={item.type} /> : null}

          <h3 className="mobile-preview-title">{item.title}</h3>
          <p className="mobile-preview-subtitle">{item.description ?? "Sem descrição cadastrada."}</p>

          {item.type === "pdf" ? (
            <a
              className={["mobile-preview-primary-btn", mediaUrl ? "" : "is-disabled"].join(" ").trim()}
              href={mediaUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!mediaUrl}
              onClick={(event) => {
                if (!mediaUrl) event.preventDefault();
              }}
            >
              Ler Documento (PDF)
            </a>
          ) : null}

          {item.type === "image" ? (
            <a
              className={["mobile-preview-primary-btn", mediaUrl ? "" : "is-disabled"].join(" ").trim()}
              href={mediaUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!mediaUrl}
              onClick={(event) => {
                if (!mediaUrl) event.preventDefault();
              }}
            >
              Visualizar Imagem Ampliada
            </a>
          ) : null}

          {item.type === "audio" ? (
            <div className="mobile-preview-card mobile-preview-audio-card">
              <button type="button" className="mobile-preview-play-circle" onClick={() => setIsAudioPlaying((prev) => !prev)}>
                {isAudioPlaying ? <Pause size={25} /> : <Play size={25} />}
              </button>

              <div className="mobile-preview-progress-track">
                <div
                  className="mobile-preview-progress-fill"
                  style={{ width: isAudioPlaying ? "58%" : "0%" }}
                />
              </div>

              <div className="mobile-preview-time-row">
                <span>{isAudioPlaying ? "1:45" : "0:00"}</span>
                <span>3:30</span>
              </div>

              <div className="mobile-preview-lyrics-box">
                <small>LETRA DA CANÇÃO</small>
                <p>{audioLyrics}</p>
              </div>
            </div>
          ) : null}

          {item.type === "text" ? (
            <div className="mobile-preview-card">
              <p className="mobile-preview-text-body">{item.text_body ?? "Sem conteúdo textual."}</p>
            </div>
          ) : null}

          {item.type !== "text" ? (
            <div className="mobile-preview-card">
              <div className="mobile-preview-offline-head">
                <strong>Disponibilidade Offline</strong>
                <span>-- MB</span>
              </div>

              <button type="button" className="mobile-preview-outline-btn" disabled>
                Baixar para Offline
              </button>

              <a
                className={["mobile-preview-outline-btn", mediaUrl ? "" : "is-disabled"].join(" ").trim()}
                href={mediaUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!mediaUrl}
                onClick={(event) => {
                  if (!mediaUrl) event.preventDefault();
                }}
              >
                Abrir remoto
              </a>
            </div>
          ) : null}

          {!mediaUrl && item.type !== "text" ? (
            <div className="mobile-preview-card">
              <p className="mobile-preview-message">Arquivo indisponível para pré-visualização.</p>
            </div>
          ) : null}

          <div className="mobile-preview-status">
            <span className={item.published ? "is-published" : "is-draft"}>
              {item.published ? "Publicado" : "Rascunho"}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PreviewPlaceholder({ type }: { type: ItemType }) {
  const label = type === "audio" ? "AUDIO PREVIEW" : type === "pdf" ? "PDF PREVIEW" : "IMAGE PREVIEW";
  const icon =
    type === "audio" ? <Music size={42} /> : type === "pdf" ? <FileText size={42} /> : <ImageIcon size={42} />;

  return (
    <div className="mobile-preview-placeholder">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function resolveAudioLyrics(item: CatalogItem): string {
  if (item.type !== "audio") return "";
  const textBody = (item as { text_body?: string | null }).text_body;
  return textBody?.trim() || item.description?.trim() || "Sem letra cadastrada para este áudio.";
}
