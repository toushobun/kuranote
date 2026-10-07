import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t,t as n}from"./dataImport-DPFn59GQ.js";import{n as r,t as i}from"./DataImportExecutionStatus-CQ6e9epS.js";var a,o,s,c,l,u,d,f,p;e((()=>{n(),r(),a={title:`Organisms/Settings/DataImportExecutionStatus`,component:i,args:{onDownload:()=>void 0}},o={name:`导入中`,args:{result:{details:[],duplicateCount:0,failureCount:0,createdPlaceholderCount:0,holderMissingCount:0,processedCount:36,rowResults:[],successCount:36,totalCount:80},status:`importing`}},s={name:`导入中（虚拟进度条）`,args:{displayProgress:68,result:{details:[],duplicateCount:0,failureCount:0,createdPlaceholderCount:0,holderMissingCount:0,processedCount:36,rowResults:[],successCount:36,totalCount:80},status:`importing`}},c={name:`全部成功`,args:{result:{details:[],duplicateCount:0,failureCount:0,createdPlaceholderCount:0,holderMissingCount:0,processedCount:80,rowResults:[],successCount:80,totalCount:80},status:`completed`}},l={name:`全部成功并新建了待邀请成员`,args:{result:{details:[],duplicateCount:0,failureCount:0,createdPlaceholderCount:2,holderMissingCount:0,processedCount:80,rowResults:[],successCount:80,totalCount:80},status:`completed`}},u={...l,name:`全部成功并新建了待邀请成员（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},d={name:`成功、失败、疑似重复与未匹配持有人混合`,args:{result:{details:[{content:`2026-09-17 业务超市 1200`,reason:t.childCategoryRequired(`餐饮`),rowNumbers:[12],sheet:`incomeExpense`,status:`failed`},{content:`2026-09-17 钱包 → 银行卡 5000`,reason:t.duplicateWarning,rowNumbers:[18],sheet:`transfer`,status:`duplicate`},{content:`2026-09-17 全家便利店 600`,reason:t.holderMissingWarning(`小明`),rowNumbers:[22],sheet:`incomeExpense`,status:`holderMissing`}],duplicateCount:1,failureCount:1,createdPlaceholderCount:0,holderMissingCount:1,processedCount:80,rowResults:[],successCount:78,totalCount:80},status:`completed`}},f={name:`余额变更成功、失败与疑似重复汇总`,args:{status:`completed`,result:{successCount:2,failureCount:1,duplicateCount:1,createdPlaceholderCount:0,holderMissingCount:0,processedCount:3,totalCount:3,details:[{sheet:`balanceAdjustment`,rowNumbers:[3],content:`2026-01-05 现金 -20`,status:`duplicate`,reason:t.duplicateWarning},{sheet:`balanceAdjustment`,rowNumbers:[4],content:`2026-01-05 已归档账户 +50`,status:`failed`,reason:`该账户已归档，无法导入余额变更。`}],rowResults:[{sheet:`balanceAdjustment`,rowNumber:2,status:`success`,reason:null},{sheet:`balanceAdjustment`,rowNumber:3,status:`duplicate`,reason:`疑似重复`},{sheet:`balanceAdjustment`,rowNumber:4,status:`failed`,reason:`账户已归档`}]}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "导入中",
  args: {
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      processedCount: 36,
      rowResults: [],
      successCount: 36,
      totalCount: 80
    },
    status: "importing"
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "导入中（虚拟进度条）",
  args: {
    displayProgress: 68,
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      processedCount: 36,
      rowResults: [],
      successCount: 36,
      totalCount: 80
    },
    status: "importing"
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "全部成功",
  args: {
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      processedCount: 80,
      rowResults: [],
      successCount: 80,
      totalCount: 80
    },
    status: "completed"
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "全部成功并新建了待邀请成员",
  args: {
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      createdPlaceholderCount: 2,
      holderMissingCount: 0,
      processedCount: 80,
      rowResults: [],
      successCount: 80,
      totalCount: 80
    },
    status: "completed"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  ...CreatedPlaceholders,
  name: "全部成功并新建了待邀请成员（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "成功、失败、疑似重复与未匹配持有人混合",
  args: {
    result: {
      details: [{
        content: "2026-09-17 业务超市 1200",
        reason: dataImportExecutionErrorMessages.childCategoryRequired("餐饮"),
        rowNumbers: [12],
        sheet: "incomeExpense",
        status: "failed"
      }, {
        content: "2026-09-17 钱包 → 银行卡 5000",
        reason: dataImportExecutionErrorMessages.duplicateWarning,
        rowNumbers: [18],
        sheet: "transfer",
        status: "duplicate"
      }, {
        content: "2026-09-17 全家便利店 600",
        reason: dataImportExecutionErrorMessages.holderMissingWarning("小明"),
        rowNumbers: [22],
        sheet: "incomeExpense",
        status: "holderMissing"
      }],
      duplicateCount: 1,
      failureCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 1,
      processedCount: 80,
      rowResults: [],
      successCount: 78,
      totalCount: 80
    },
    status: "completed"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "余额变更成功、失败与疑似重复汇总",
  args: {
    status: "completed",
    result: {
      successCount: 2,
      failureCount: 1,
      duplicateCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      processedCount: 3,
      totalCount: 3,
      details: [{
        sheet: "balanceAdjustment",
        rowNumbers: [3],
        content: "2026-01-05 现金 -20",
        status: "duplicate",
        reason: dataImportExecutionErrorMessages.duplicateWarning
      }, {
        sheet: "balanceAdjustment",
        rowNumbers: [4],
        content: "2026-01-05 已归档账户 +50",
        status: "failed",
        reason: "该账户已归档，无法导入余额变更。"
      }],
      rowResults: [{
        sheet: "balanceAdjustment",
        rowNumber: 2,
        status: "success",
        reason: null
      }, {
        sheet: "balanceAdjustment",
        rowNumber: 3,
        status: "duplicate",
        reason: "疑似重复"
      }, {
        sheet: "balanceAdjustment",
        rowNumber: 4,
        status: "failed",
        reason: "账户已归档"
      }]
    }
  }
}`,...f.parameters?.docs?.source}}},p=[`Importing`,`ImportingWithSimulatedProgress`,`AllSucceeded`,`CreatedPlaceholders`,`CreatedPlaceholdersMobile`,`MixedResult`,`BalanceAdjustmentResult`]}))();export{c as AllSucceeded,f as BalanceAdjustmentResult,l as CreatedPlaceholders,u as CreatedPlaceholdersMobile,o as Importing,s as ImportingWithSimulatedProgress,d as MixedResult,p as __namedExportsOrder,a as default};