import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatNodes } from "./formatNodes";

describe("formatNodes", () => {
  it("places nodes where the translation puts the placeholders", () => {
    const html = renderToStaticMarkup(<p>{formatNodes("{login} or {register} to comment", { login: <a>Log in</a>, register: <b>sign up</b> })}</p>);
    expect(html).toBe("<p><a>Log in</a> or <b>sign up</b> to comment</p>");
  });
});
