import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "./Markdown";

const render = (content: string) => renderToStaticMarkup(<Markdown content={content} />);

describe("Markdown (AI replies)", () => {
  it("renders bold, lists and code", () => {
    const html = render("**Tip:** use STAR\n\n- one\n- two\n\n`code`");
    expect(html).toContain("<strong");
    expect(html).toContain("<ul");
    expect(html).toContain("<code");
  });

  it("never turns model output into real HTML", () => {
    const html = render('<img src=x onerror="alert(1)"> <script>alert(1)</script>');
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
  });

  it("only links to http(s) URLs", () => {
    expect(render("[ok](https://example.com)")).toContain('href="https://example.com"');
    expect(render("[bad](javascript:alert(1))")).not.toContain("href=");
  });
});
