import React, { useCallback, useMemo } from "react";
import _ from "underscore";

import type { ITreeNodeItem } from "metabase/components/tree/types";

import type Database from "metabase-lib/metadata/Database";
import type Table from "metabase-lib/metadata/Table";
import type Schema from "metabase-lib/metadata/Schema";

import type { DataPickerSelectedItem } from "../types";

import EmptyState from "../EmptyState";
import LoadingState from "../LoadingState";
import VirtualizedSelectList from "../VirtualizedSelectList";
import PanePicker from "../PanePicker";
import { ListContainer } from "./RawDataPicker.styled";

interface RawDataPickerViewProps {
  databases: Database[];
  tables?: Table[];
  selectedItems: DataPickerSelectedItem[];
  isLoading: boolean;
  onSelectDatabase: (id: Database["id"]) => void;
  onSelectSchema: (id: Schema["id"]) => void;
  onSelectedTable: (id: Table["id"]) => void;
  onBack?: () => void;
}

function schemaToTreeItem(schema: Schema): ITreeNodeItem {
  return {
    id: String(schema.id),
    name: schema.name,
    icon: "folder",
  };
}

function dbToTreeItem(database: Database): ITreeNodeItem {
  const schemas = database.getSchemas();
  const hasSingleSchema = schemas.length === 1;
  return {
    id: database.id,
    name: database.name,
    icon: "database",

    // If a database has a single schema,
    // we just want to automatically select it
    // and exclude it from the tree picker
    children: hasSingleSchema ? [] : schemas.map(schemaToTreeItem),
  };
}

function TableSelectListItem({
  table,
  isSelected,
  onSelect,
}: {
  table: Table;
  isSelected: boolean;
  onSelect: (id: Table["id"]) => void;
}) {
  const name = table.displayName();
  return (
    <VirtualizedSelectList.Item
      id={table.id}
      name={name}
      isSelected={isSelected}
      icon={isSelected ? "check" : "table2"}
      onSelect={onSelect}
    >
      {name}
    </VirtualizedSelectList.Item>
  );
}

function RawDataPickerView({
  databases,
  tables,
  selectedItems,
  isLoading,
  onSelectDatabase,
  onSelectSchema,
  onSelectedTable,
  onBack,
}: RawDataPickerViewProps) {
  const treeData = useMemo(() => databases.map(dbToTreeItem), [databases]);

  const { selectedDatabaseId, selectedSchemaId, selectedTableIds } =
    useMemo(() => {
      const {
        database: databases = [],
        schema: schemas = [],
        table: tables = [],
      } = _.groupBy(selectedItems, "type");

      const [db] = databases;
      const [schema] = schemas;

      return {
        selectedDatabaseId: db?.id,
        selectedSchemaId: schema?.id,
        selectedTableIds: tables.map(table => table.id),
      };
    }, [selectedItems]);

  const selectedDatabase = useMemo(
    () => databases.find(db => db.id === selectedDatabaseId),
    [databases, selectedDatabaseId],
  );

  const isSelectedDatabaseSingleSchema = useMemo(
    () => selectedDatabase?.getSchemas().length === 1,
    [selectedDatabase],
  );

  const selectedTreeItemId = useMemo(() => {
    if (selectedSchemaId) {
      return isSelectedDatabaseSingleSchema
        ? selectedDatabaseId
        : selectedSchemaId;
    }
    return selectedDatabaseId;
  }, [selectedDatabaseId, selectedSchemaId, isSelectedDatabaseSingleSchema]);

  const handlePanePickerSelect = useCallback(
    (item: ITreeNodeItem) => {
      if (item.icon === "database") {
        return onSelectDatabase(Number(item.id));
      }
      if (item.icon === "folder") {
        return onSelectSchema(String(item.id));
      }
    },
    [onSelectDatabase, onSelectSchema],
  );

  const renderTable = useCallback(
    ({ item: table }: { item: Table }) => (
      <TableSelectListItem
        table={table}
        isSelected={selectedTableIds.includes(table.id)}
        onSelect={onSelectedTable}
      />
    ),
    [selectedTableIds, onSelectedTable],
  );

  const hasDatabases = databases.length > 0;
  const hasTables = !_.isEmpty(tables);
  const isEmpty = !hasDatabases || (selectedDatabaseId && !hasTables);

  return (
    <PanePicker
      data={treeData}
      selectedId={selectedTreeItemId}
      onSelect={handlePanePickerSelect}
      onBack={onBack}
    >
      {isLoading ? (
        <LoadingState />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <ListContainer>
          {Array.isArray(tables) && (
            <VirtualizedSelectList<Table>
              items={tables}
              renderItem={renderTable}
            />
          )}
        </ListContainer>
      )}
    </PanePicker>
  );
}

export default RawDataPickerView;
