import { MasterBlock } from "../blocks/MasterBlock";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const layoutConfig = {
  Accordion: {
    fields: {
      title: { type: "text" },
      items: {
        type: "array",
        getItemSummary: (item: any) => item.label || "Accordion Item",
        fields: {
          label: { type: "text" },
          content: { type: "textarea" },
        },
      },
      variant: {
        type: "select",
        options: [
          { label: "Glass", value: "glass" },
          { label: "Neon", value: "neon" },
        ],
      },
      glowColor: { type: "text" },
    },
    defaultProps: {
      title: "FAQ / Info",
      items: [
        { label: "Item One", content: "Accordion content 1" },
        { label: "Item Two", content: "Accordion content 2" },
      ],
      variant: "glass",
      glowColor: "#00f3ff",
      iconName: "List",
      triggerEvent: "onHover",
    },
    render: ({ title, items = [], ...props }: any) => (
      <MasterBlock title={title || "FAQ / Info"} iconName="List" {...props}>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item: any, i: number) => (
            <AccordionItem value={`item-${i}`} key={i} className="border-zinc-800">
              <AccordionTrigger className="text-zinc-200 hover:text-cyan-400">{item.label}</AccordionTrigger>
              <AccordionContent className="text-zinc-400">{item.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </MasterBlock>
    ),
  },

  Tabs: {
    fields: {
      title: { type: "text" },
      tabs: {
        type: "array",
        fields: {
          label: { type: "text" },
          content: { type: "textarea" },
        },
      },
      glowColor: { type: "text" },
    },
    defaultProps: {
      title: "Navigation",
      tabs: [
        { label: "Tab 1", content: "First tab content" },
        { label: "Tab 2", content: "Second tab content" },
      ],
      glowColor: "#00f3ff",
      iconName: "Layout",
      triggerEvent: "onHover",
      variant: "glass",
    },
    render: ({ title, tabs = [], ...props }: any) => (
      <MasterBlock title={title || "Navigation"} iconName="Layout" {...props} variant="glass">
        <Tabs defaultValue="tab-0" className="w-full">
          <TabsList className="w-full justify-start border border-white/10 bg-black/40">
            {tabs.map((tab: any, i: number) => (
              <TabsTrigger key={i} value={`tab-${i}`} className="data-[state=active]:bg-cyan-500/20">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab: any, i: number) => (
            <TabsContent key={i} value={`tab-${i}`} className="mt-4 p-2">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </MasterBlock>
    ),
  },
};
