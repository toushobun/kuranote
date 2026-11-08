import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  dataImportExportEntryMessages,
  dataImportExportPageMessages,
} from "config/dataImportExportMessages";
import { routePaths } from "config/paths";
import { settingsPageMessages } from "config/settingsMessages";

import SettingsDataLoading from "./loading";

describe("SettingsDataLoading", () => {
  it("显示数据导入导出页本身的内容，而不是「我的」的骨架", () => {
    render(<SettingsDataLoading />);

    expect(
      screen.getByRole("heading", { name: dataImportExportPageMessages.title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: settingsPageMessages.title }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: new RegExp(dataImportExportEntryMessages.import.title),
      }),
    ).toHaveAttribute("href", routePaths.settingsDataImport);
  });
});
