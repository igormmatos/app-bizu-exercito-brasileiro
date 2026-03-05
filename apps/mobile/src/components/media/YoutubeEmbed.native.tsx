import type { ViewStyle } from "react-native";

type YoutubeEmbedProps = {
  videoId: string;
  onError: () => void;
  style?: ViewStyle;
  height?: number;
};

export default function YoutubeEmbed({ videoId, onError, style, height = 220 }: YoutubeEmbedProps) {
  void videoId;
  void onError;
  void style;
  void height;
  return null;
}
