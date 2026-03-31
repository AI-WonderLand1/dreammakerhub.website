import * as React from "react";

export type ComponentConfig<Props extends Record<string, any> = Record<string, any>> = {
  label?: string;
  fields?: Record<string, any>;
  defaultProps?: Record<string, any>;
  render: (props: Props) => React.ReactNode;
};

export type Config<Props extends Record<string, any> = Record<string, any>> = {
  components: { [K in keyof Props]: ComponentConfig<Props[K]> };
};

export type PuckDataItem = { type: string; props: Record<string, any> };
export type Data = { content: PuckDataItem[] };

export type RichTextField = {
  type: "richtext";
  contentEditable: boolean;
  editor: {
    bold?: boolean;
    heading?: { levels: number[] };
    extensions?: any[];
    menu?: React.ReactNode;
  };
};

export function Puck<Props extends Record<string, any>>(props: {
  config: Config<Props>;
  data: Data;
  onChange?: (data: Data) => void;
  children?: React.ReactNode;
  iframe?: { enabled?: boolean; permissions?: Record<string, any> };
}): React.ReactElement;

export namespace Puck {
  export const Layout: React.FC;
}

export const RichTextMenu: React.FC<{ children: React.ReactNode }> & {
  Group: React.FC<{ children: React.ReactNode }>;
  Bold: React.FC;
};

export default Puck;
