import type { ReactElement } from "react";
import type { ViewStyle } from "react-native";

type YoutubeEmbedProps = {
  videoId: string;
  onError: () => void;
  style?: ViewStyle;
  height?: number;
};

declare function YoutubeEmbed(props: YoutubeEmbedProps): ReactElement | null;

export default YoutubeEmbed;
