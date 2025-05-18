import React from "react";
import Sprite from "./Sprite";

export default function Stage({ robot, bg }) {
  let style = {
    width: 320,
    height: 240,
    position: "relative",
  };

  if (bg === "grid") {
    style.background = "repeating-linear-gradient(0deg,#eaeaea,#eaeaea 28px,#fff 28px,#fff 56px),repeating-linear-gradient(90deg,#eaeaea,#eaeaea 28px,#fff 28px,#fff 56px)";
    style.backgroundSize = "56px 56px";
  } else if (bg === "space") {
    style.background = "url(/image.png)";
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  } else if (bg === "city") {
    style.background = "url(/city.avif)";
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  } else if (bg === "plain") {
    style.background = "linear-gradient(to bottom right, #fdfdfd, #eeeeee)";
  }

  return (
    <div className="stage" style={style}>
      <Sprite {...robot} />
    </div>
  );
}