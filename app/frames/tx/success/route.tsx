import { Button } from "frames.js/next";
import { frames } from "../../frames";

const handleRequest = frames(async (ctx) => {
  const inputText = ctx.message?.inputText;
  const button = ctx.message?.buttonIndex;
  return {
    image: (
      <div tw="flex flex-col">
        <div tw="flex flex-col">All requests completed</div>
      </div>
    ),
    buttons: [],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
