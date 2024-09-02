import { Button } from "frames.js/next";
import { frames } from "./frames";

const handleRequest = frames(() => {
  return {
    title: "Main Frame",
    image: `${process.env.NEXT_PUBLIC_BASE_URL}/images/main.png`,
    buttons: [
      <Button key="0" action="link" target="https://www.brianknows.org/">
        Learn more about Brian
      </Button>,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
