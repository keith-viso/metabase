import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, getIcon } from "__support__/ui";

import PinnedItemCard from "./PinnedItemCard";

const mockOnCopy = jest.fn();
const mockOnMove = jest.fn();

const defaultCollection = {
  can_write: true,
  id: 1,
  name: "Collection Foo",
  archived: false,
};

const defaultItem = {
  id: 1,
  model: "dashboard",
  collection_position: 1,
  name: "Dashboard Foo",
  description: "description foo foo foo",
  getIcon: () => ({ name: "dashboard" }),
  getUrl: () => "/dashboard/1",
  setArchived: jest.fn(),
  setPinned: jest.fn(),
};

function setup({ item, collection } = {}) {
  item = item || defaultItem;
  collection = collection || defaultCollection;

  mockOnCopy.mockReset();
  mockOnMove.mockReset();
  item.setArchived.mockReset();
  item.setPinned.mockReset();

  return render(
    <PinnedItemCard
      item={item}
      collection={collection}
      onCopy={mockOnCopy}
      onMove={mockOnMove}
    />,
  );
}

describe("PinnedItemCard", () => {
  it("should show the item's icon", () => {
    setup();
    expect(getIcon(defaultItem.getIcon().name)).toBeInTheDocument();
  });

  it("should show the item's name", () => {
    setup();
    expect(screen.getByText(defaultItem.name)).toBeInTheDocument();
  });

  it("should show the item's description", () => {
    setup();
    expect(screen.getByText(defaultItem.description)).toBeInTheDocument();
  });

  it("should show a default description if there is no item description", () => {
    const item = {
      ...defaultItem,
      description: null,
    };
    setup({ item });

    expect(screen.getByText("A dashboard")).toBeInTheDocument();
  });

  it("should show an action menu when user clicks on the menu icon in the card", () => {
    setup();
    userEvent.click(getIcon("ellipsis"));
    expect(screen.getByText("Unpin")).toBeInTheDocument();
  });
});
