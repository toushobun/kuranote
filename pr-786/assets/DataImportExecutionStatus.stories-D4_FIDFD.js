import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./DataImportExecutionStatus-Bxl29rnk.js";var r,i,a,o,s,c;e((()=>{t(),r={title:`Organisms/Settings/DataImportExecutionStatus`,component:n,args:{onDownload:()=>void 0}},i={name:`导入中`,args:{result:{details:[],duplicateCount:0,failureCount:0,holderMissingCount:0,processedCount:36,rowResults:[],successCount:36,totalCount:80},status:`importing`}},a={name:`导入中（预测式动画进度）`,args:{displayProgress:68,result:{details:[],duplicateCount:0,failureCount:0,holderMissingCount:0,processedCount:36,rowResults:[],successCount:36,totalCount:80},status:`importing`}},o={name:`全部成功`,args:{result:{details:[],duplicateCount:0,failureCount:0,holderMissingCount:0,processedCount:80,rowResults:[],successCount:80,totalCount:80},status:`completed`}},s={name:`成功、失败、疑似重复与未匹配持有人混合`,args:{result:{details:[{content:`2026-09-17 业务超市 1200`,reason:`一级分类「餐饮」没有填写二级分类；当前交易记录必须使用二级分类。`,rowNumbers:[12],sheet:`incomeExpense`,status:`failed`},{content:`2026-09-17 钱包 → 银行卡 5000`,reason:`疑似与现有记录重复，但已继续导入。`,rowNumbers:[18],sheet:`transfer`,status:`duplicate`},{content:`2026-09-17 全家便利店 600`,reason:`账本内找不到显示名为「小明」的有效成员，已按无持有人继续导入该笔记录。`,rowNumbers:[22],sheet:`incomeExpense`,status:`holderMissing`}],duplicateCount:1,failureCount:1,holderMissingCount:1,processedCount:80,rowResults:[],successCount:78,totalCount:80},status:`completed`}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "导入中",
  args: {
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      holderMissingCount: 0,
      processedCount: 36,
      rowResults: [],
      successCount: 36,
      totalCount: 80
    },
    status: "importing"
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "导入中（预测式动画进度）",
  args: {
    displayProgress: 68,
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      holderMissingCount: 0,
      processedCount: 36,
      rowResults: [],
      successCount: 36,
      totalCount: 80
    },
    status: "importing"
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "全部成功",
  args: {
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      holderMissingCount: 0,
      processedCount: 80,
      rowResults: [],
      successCount: 80,
      totalCount: 80
    },
    status: "completed"
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "成功、失败、疑似重复与未匹配持有人混合",
  args: {
    result: {
      details: [{
        content: "2026-09-17 业务超市 1200",
        reason: "一级分类「餐饮」没有填写二级分类；当前交易记录必须使用二级分类。",
        rowNumbers: [12],
        sheet: "incomeExpense",
        status: "failed"
      }, {
        content: "2026-09-17 钱包 → 银行卡 5000",
        reason: "疑似与现有记录重复，但已继续导入。",
        rowNumbers: [18],
        sheet: "transfer",
        status: "duplicate"
      }, {
        content: "2026-09-17 全家便利店 600",
        reason: "账本内找不到显示名为「小明」的有效成员，已按无持有人继续导入该笔记录。",
        rowNumbers: [22],
        sheet: "incomeExpense",
        status: "holderMissing"
      }],
      duplicateCount: 1,
      failureCount: 1,
      holderMissingCount: 1,
      processedCount: 80,
      rowResults: [],
      successCount: 78,
      totalCount: 80
    },
    status: "completed"
  }
}`,...s.parameters?.docs?.source}}},c=[`Importing`,`ImportingWithSimulatedProgress`,`AllSucceeded`,`MixedResult`]}))();export{o as AllSucceeded,i as Importing,a as ImportingWithSimulatedProgress,s as MixedResult,c as __namedExportsOrder,r as default};