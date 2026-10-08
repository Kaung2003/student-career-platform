import { Fragment, type ReactNode } from "react";

/** Fills {placeholders} in a translated string with React nodes (links, bold text...). */
export function formatNodes(template: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/g).map((part, i) => {
    const match = /^\{(\w+)\}$/.exec(part);
    const name = match?.[1];
    return <Fragment key={i}>{name && name in nodes ? nodes[name] : part}</Fragment>;
  });
}
