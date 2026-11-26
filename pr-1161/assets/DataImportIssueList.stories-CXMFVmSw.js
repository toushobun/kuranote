import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./DataImportIssueList-Dsu9MgrE.js";var r,i,a,o;e((()=>{t(),r={title:`Organisms/Settings/DataImportIssueList`,component:n},i={name:`按工作表分组`,args:{issues:[{reason:`缺少必填列。`,rows:[]},{sheet:`incomeExpense`,column:`金额`,reason:`金额格式不正确。`,rows:[2,5,8]},{sheet:`transfer`,reason:`转出账户不能为空。`,rows:[3]}]}},a={name:`超过二十组`,args:{issues:Array.from({length:23},(e,t)=>({sheet:`incomeExpense`,reason:`账户 ${t+1} 无法导入。`,rows:[t+2]}))}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "按工作表分组",
  args: {
    issues: [{
      reason: "缺少必填列。",
      rows: []
    }, {
      sheet: "incomeExpense",
      column: "金额",
      reason: "金额格式不正确。",
      rows: [2, 5, 8]
    }, {
      sheet: "transfer",
      reason: "转出账户不能为空。",
      rows: [3]
    }]
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "超过二十组",
  args: {
    issues: Array.from({
      length: 23
    }, (_, index) => ({
      sheet: "incomeExpense" as const,
      reason: \`账户 \${index + 1} 无法导入。\`,
      rows: [index + 2]
    }))
  }
}`,...a.parameters?.docs?.source}}},o=[`Grouped`,`Overflow`]}))();export{i as Grouped,a as Overflow,o as __namedExportsOrder,r as default};