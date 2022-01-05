import { rest } from "msw";
import { setupServer } from "msw/node";

const handlers = [
  rest.post("https://libretranslate.de/translate", (req, res, ctx) => {
    // Access the target property from the body of the request
    const { target } = req.body;

    // Change the response based on the target
    let text;
    if (target === "fr") {
      text = "Bonjour.";
    } else {
      text = "Holaaa.";
    }
    return res(ctx.json({ translatedText: text }));
  }),
];

export const server = setupServer(...handlers);
