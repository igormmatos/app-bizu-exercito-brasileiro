import { createElement } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

type YoutubeEmbedProps = {
  videoId: string;
  onError: () => void;
  style?: ViewStyle;
  height?: number;
};

export default function YoutubeEmbed(_props: YoutubeEmbedProps) {
  const { videoId, onError, style, height } = _props;
  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`;

  return (
    <View style={[styles.wrapper, height ? { height } : styles.ratio, style]}>
      {createElement("iframe", {
        src,
        title: "YouTube video player",
        allow: "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        referrerPolicy: "strict-origin-when-cross-origin",
        allowFullScreen: true,
        onError,
        style: styles.iframe,
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "hidden",
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: "#000",
  },
  ratio: {
    aspectRatio: 16 / 9,
  },
  iframe: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
    borderStyle: "none",
    display: "block",
  } as unknown as ViewStyle,
});
