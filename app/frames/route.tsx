import { Button } from "frames.js/next";
import { frames } from "./frames";

const handleRequest = frames(() => {
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
    buttons: [],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
