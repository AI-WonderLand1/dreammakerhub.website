import React from "react";
import { Config } from "@puckeditor/core";
import { Button } from "@/lib/puck-lite";
import { Card, CardHeader, CardContent, CardFooter } from "@/lib/puck-lite";
import { Badge } from "@/lib/puck-lite";
import { Alert } from "@/lib/puck-lite";

export const shadonComponents = {
  Button: {
    fields: {
      variant: {
        type: "select",
        options: [
          { label: "Default", value: "default" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
          { label: "Destructive", value: "destructive" },
          { label: "Secondary", value: "secondary" },
        ],
      },
      size: {
        type: "select",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
      children: { type: "text" },
    },
    defaultProps: {
      variant: "default",
      size: "md",
      children: "Button",
    },
    render: ({ variant, size, children, ...props }: any) => (
      <Button variant={variant} size={size} {...props}>
        {children}
      </Button>
    ),
  },

  Card: {
    fields: {
      title: { type: "text" },
      description: { type: "text" },
      variant: {
        type: "select",
        options: [
          { label: "Default", value: "default" },
          { label: "Bordered", value: "bordered" },
          { label: "Glass", value: "glass" },
        ],
      },
      children: { type: "text" },
    },
    defaultProps: {
      variant: "default",
      title: "Card Title",
      children: "Card content",
    },
    render: ({ title, description, variant, children, ...props }: any) => (
      <Card title={title} description={description} variant={variant} {...props}>
        {children}
      </Card>
    ),
  },

  CardHeader: {
    fields: {
      children: { type: "text" },
    },
    defaultProps: {
      children: "Card Header",
    },
    render: ({ children, ...props }: any) => <CardHeader {...props}>{children}</CardHeader>,
  },

  CardContent: {
    fields: {
      children: { type: "text" },
    },
    defaultProps: {
      children: "Card Content",
    },
    render: ({ children, ...props }: any) => <CardContent {...props}>{children}</CardContent>,
  },

  CardFooter: {
    fields: {
      children: { type: "text" },
    },
    defaultProps: {
      children: "Card Footer",
    },
    render: ({ children, ...props }: any) => <CardFooter {...props}>{children}</CardFooter>,
  },

  Badge: {
    fields: {
      variant: {
        type: "select",
        options: [
          { label: "Default", value: "default" },
          { label: "Secondary", value: "secondary" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Destructive", value: "destructive" },
          { label: "Outline", value: "outline" },
        ],
      },
      children: { type: "text" },
    },
    defaultProps: {
      variant: "default",
      children: "Badge",
    },
    render: ({ variant, children, ...props }: any) => (
      <Badge variant={variant} {...props}>
        {children}
      </Badge>
    ),
  },

  Alert: {
    fields: {
      variant: {
        type: "select",
        options: [
          { label: "Default", value: "default" },
          { label: "Info", value: "info" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Destructive", value: "destructive" },
        ],
      },
      title: { type: "text" },
      children: { type: "text" },
    },
    defaultProps: {
      variant: "default",
      title: "Alert Title",
      children: "Alert message",
    },
    render: ({ variant, title, children, ...props }: any) => (
      <Alert variant={variant} title={title} {...props}>
        {children}
      </Alert>
    ),
  },
};

const config: Config = {
  components: shadonComponents,
  categories: {
    shadon: {
      title: "Shadon UI",
      components: Object.keys(shadonComponents),
    },
  },
};

export { shadonComponents };
export default config;
