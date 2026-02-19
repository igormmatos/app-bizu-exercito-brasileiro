import { FileText, Image as ImageIcon, Pause, Play, PlayIcon, Repeat, RotateCcw, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { parseSafeHtml, type CatalogItem, type HtmlInlineNode } from "@bizu/shared";
import { getPublicFileUrl } from "../lib/catalogApi";
import { Modal } from "./ui";

type ItemPreviewModalProps = {
  item: CatalogItem | null;
  onClose: () => void;
};

export function ItemPreviewModal({ item, onClose }: ItemPreviewModalProps) {
  if (!item) return null;

  const mediaType = resolveMediaType(item);
  const mediaUrl = mediaType && item.storage_path ? getPublicFileUrl(item.storage_path) : null;
  const audioLyrics = resolveAudioLyrics(item);
  const textBody = item.text_body?.trim() ?? "";
  const htmlBlocks = parseSafeHtml(textBody);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(false);

  useEffect(() => {
    setIsFavorited(false);
    setIsAudioPlaying(false);
    setRepeatEnabled(false);
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

          {item.type === "pdf" || item.type === "image" ? <PreviewPlaceholder type={item.type} /> : null}

          <h3 className="mobile-preview-title">{item.title}</h3>

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

          {mediaType === "audio" ? (
            <div className="mobile-preview-card mobile-preview-audio-card">
              <div className="mobile-preview-audio-transport">
                <button type="button" className="mobile-preview-transport-btn" aria-label="Reiniciar faixa">
                  <RotateCcw size={16} />
                  <span>0:00</span>
                </button>
                <button type="button" className="mobile-preview-transport-btn" aria-label="Voltar cinco segundos">
                  <PlayIcon size={16} className="is-backward" />
                  <span>-5s</span>
                </button>
                <button type="button" className="mobile-preview-play-circle" onClick={() => setIsAudioPlaying((prev) => !prev)}>
                  {isAudioPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button type="button" className="mobile-preview-transport-btn" aria-label="Avançar cinco segundos">
                  <PlayIcon size={16} />
                  <span>+5s</span>
                </button>
                <button
                  type="button"
                  className={`mobile-preview-transport-btn ${repeatEnabled ? "is-repeat-enabled" : ""}`}
                  onClick={() => setRepeatEnabled((prev) => !prev)}
                  aria-label="Alternar repetição"
                >
                  <Repeat size={16} />
                  <span>{repeatEnabled ? "ON" : "OFF"}</span>
                </button>
              </div>

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

          {item.type === "text" && mediaType === "image" ? (
            <div className="mobile-preview-card mobile-preview-inline-image-card">
              {mediaUrl ? (
                <img src={mediaUrl} alt={item.title} className="mobile-preview-inline-image" />
              ) : (
                <p className="mobile-preview-message">Imagem indisponível para pré-visualização.</p>
              )}
            </div>
          ) : null}

          {(item.type === "text" || (item.type === "image" && textBody)) ? (
            <div className="mobile-preview-card">
              {htmlBlocks.length > 0 ? renderHtmlBlocks(htmlBlocks) : <p className="mobile-preview-text-body">Sem conteúdo textual.</p>}
            </div>
          ) : null}

          {mediaType ? (
            <div className="mobile-preview-card">
              <div className="mobile-preview-offline-head">
                <strong>Disponibilidade Offline</strong>
                <span>-- MB</span>
              </div>

              <button type="button" className="mobile-preview-outline-btn" disabled>
                Baixar para Offline
              </button>

              {item.type === "pdf" || item.type === "image" ? (
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
              ) : null}
            </div>
          ) : null}

          {!mediaUrl && mediaType ? (
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

function PreviewPlaceholder({ type }: { type: "pdf" | "image" }) {
  const label = type === "pdf" ? "PDF PREVIEW" : "IMAGE PREVIEW";
  const icon = type === "pdf" ? <FileText size={42} /> : <ImageIcon size={42} />;

  return (
    <div className="mobile-preview-placeholder">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function resolveAudioLyrics(item: CatalogItem): string {
  if (item.type !== "audio") return "";
  return item.text_body?.trim() || item.description?.trim() || "Sem letra cadastrada para este áudio.";
}

function resolveMediaType(item: CatalogItem): "pdf" | "audio" | "image" | null {
  if (!item.storage_path) {
    return null;
  }
  if (item.type === "pdf" || item.type === "audio" || item.type === "image") {
    return item.type;
  }
  if (item.type === "text" && item.storage_path.startsWith("image/")) {
    return "image";
  }
  return null;
}

function renderHtmlBlocks(blocks: ReturnType<typeof parseSafeHtml>) {
  return (
    <div className="mobile-preview-markdown">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={`paragraph-${index}`} className="mobile-preview-markdown__paragraph">
              {renderHtmlInline(block.inlines)}
            </p>
          );
        }

        const ListTag = block.ordered ? "ol" : "ul";
        return (
          <ListTag key={`list-${index}`} className="mobile-preview-markdown__list">
            {block.items.map((item, itemIndex) => (
              <li key={`list-item-${index}-${itemIndex}`}>{renderHtmlInline(item)}</li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}

function renderHtmlInline(nodes: HtmlInlineNode[]) {
  return nodes.map((node, index) => {
    if (node.type === "br") {
      return <br key={`br-${index}`} />;
    }

    let content: JSX.Element = <span>{node.text}</span>;
    if (node.bold) {
      content = <strong>{content}</strong>;
    }
    if (node.italic) {
      content = <em>{content}</em>;
    }
    if (node.href) {
      content = (
        <a href={node.href} target="_blank" rel="noreferrer">
          {content}
        </a>
      );
    }
    return <span key={`text-${index}`}>{content}</span>;
  });
}
