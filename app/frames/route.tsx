import { Button } from "frames.js/next";
import { frames } from "./frames";

const handleRequest = frames(async (ctx) => {
  return {
    image: (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        Brian Agent XMTP Frame
      </div>
    ),
    textInput: "Type something here",
    buttons: [],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
