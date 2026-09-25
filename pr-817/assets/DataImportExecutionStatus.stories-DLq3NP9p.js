import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./DataImportExecutionStatus-BOQ30CV7.js";var r,i,a,o,s,c,l,u,d;e((()=>{t(),r={title:`Organisms/Settings/DataImportExecutionStatus`,component:n,args:{onDownload:()=>void 0}},i={name:`导入中`,args:{result:{details:[],duplicateCount:0,failureCount:0,createdPlaceholderCount:0,holderMissingCount:0,processedCount:36,rowResults:[],successCount:36,totalCount:80},status:`importing`}},a={name:`导入中（虚拟进度条）`,args:{displayProgress:68,result:{details:[],duplicateCount:0,failureCount:0,createdPlaceholderCount:0,holderMissingCount:0,processedCount:36,rowResults:[],successCount:36,totalCount:80},status:`importing`}},o={name:`全部成功`,args:{result:{details:[],duplicateCount:0,failureCount:0,createdPlaceholderCount:0,holderMissingCount:0,processedCount:80,rowResults:[],successCount:80,totalCount:80},status:`completed`}},s={name:`全部成功并新建了待邀请成员`,args:{result:{details:[],duplicateCount:0,failureCount:0,createdPlaceholderCount:2,holderMissingCount:0,processedCount:80,rowResults:[],successCount:80,totalCount:80},status:`completed`}},c={...s,name:`全部成功并新建了待邀请成员（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},l={name:`成功、失败、疑似重复与未匹配持有人混合`,args:{result:{details:[{content:`2026-09-17 业务超市 1200`,reason:`一级分类「餐饮」没有填写二级分类；当前交易记录必须使用二级分类。`,rowNumbers:[12],sheet:`incomeExpense`,status:`failed`},{content:`2026-09-17 钱包 → 银行卡 5000`,reason:`疑似与现有记录重复，但已继续导入。`,rowNumbers:[18],sheet:`transfer`,status:`duplicate`},{content:`2026-09-17 全家便利店 600`,reason:`账本内找不到显示名为「小明」的有效成员，已按无持有人继续导入该笔记录。`,rowNumbers:[22],sheet:`incomeExpense`,status:`holderMissing`}],duplicateCount:1,failureCount:1,createdPlaceholderCount:0,holderMissingCount:1,processedCount:80,rowResults:[],successCount:78,totalCount:80},status:`completed`}},u={name:`余额变更成功、失败与疑似重复汇总`,args:{status:`completed`,result:{successCount:2,failureCount:1,duplicateCount:1,createdPlaceholderCount:0,holderMissingCount:0,processedCount:3,totalCount:3,details:[{sheet:`balanceAdjustment`,rowNumbers:[3],content:`2026-01-05 现金 -20`,status:`duplicate`,reason:`疑似与现有记录重复，但已继续导入。`},{sheet:`balanceAdjustment`,rowNumbers:[4],content:`2026-01-05 已归档账户 +50`,status:`failed`,reason:`该账户已归档，无法导入余额变更。`}],rowResults:[{sheet:`balanceAdjustment`,rowNumber:2,status:`success`,reason:null},{sheet:`balanceAdjustment`,rowNumber:3,status:`duplicate`,reason:`疑似重复`},{sheet:`balanceAdjustment`,rowNumber:4,status:`failed`,reason:`账户已归档`}]}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
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
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
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
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  ...CreatedPlaceholders,
  name: "全部成功并新建了待邀请成员（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
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
      createdPlaceholderCount: 0,
      holderMissingCount: 1,
      processedCount: 80,
      rowResults: [],
      successCount: 78,
      totalCount: 80
    },
    status: "completed"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
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
        reason: "疑似与现有记录重复，但已继续导入。"
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
}`,...u.parameters?.docs?.source}}},d=[`Importing`,`ImportingWithSimulatedProgress`,`AllSucceeded`,`CreatedPlaceholders`,`CreatedPlaceholdersMobile`,`MixedResult`,`BalanceAdjustmentResult`]}))();export{o as AllSucceeded,u as BalanceAdjustmentResult,s as CreatedPlaceholders,c as CreatedPlaceholdersMobile,i as Importing,a as ImportingWithSimulatedProgress,l as MixedResult,d as __namedExportsOrder,r as default};