import { DataImportExportTemplate } from "templates/settings/DataImportExport";

// 数据导入导出入口页不读取任何数据，加载中直接显示与最终页面相同的内容，避免回退到「我的」的骨架。
export default function SettingsDataLoading() {
  return <DataImportExportTemplate />;
}
