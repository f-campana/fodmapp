import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Foundation/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
  argTypes: {
    "aria-label": {
      description: "Accessible label for the breadcrumb navigation landmark.",
      control: "text",
      table: { defaultValue: { summary: "Fil d'Ariane" } },
    },
    className: {
      description: "Additional classes merged with breadcrumb root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Breadcrumb list and items rendered inside the nav.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    "aria-label": "Fil d'Ariane",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultTrail: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/recettes">Recettes</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Détails</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Fil d'Ariane" });
    await expect(nav).toHaveAttribute("data-slot", "breadcrumb");
    await expect(canvas.getByText("Accueil")).toHaveAttribute(
      "data-slot",
      "breadcrumb-link",
    );
    await expect(canvas.getByText("Détails")).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

export const WithEllipsis: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Résultat</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separators = canvas.getAllByText("/");
    await expect(separators).toHaveLength(2);
    await expect(separators[0]).toHaveAttribute(
      "data-slot",
      "breadcrumb-separator",
    );
    await expect(canvas.getByText("Plus")).toBeInTheDocument();
  },
};

export const AsChildLink: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <a href="/profil">Profil</a>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Profil" });
    await expect(link).toHaveAttribute("href", "/profil");
    await expect(link).toHaveAttribute("data-slot", "breadcrumb-link");
  },
};

export const DarkMode: Story = {
  ...DefaultTrail,
  globals: {
    theme: "dark",
  },
};
