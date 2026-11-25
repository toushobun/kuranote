import{i as e}from"./preload-helper-D2yxXLVK.js";import{p as t,t as n}from"./dataImport-D84-91Ka.js";import{n as r,t as i}from"./DataImportExecutionStatus-BcF8SJp7.js";var a,o,s,c,l,u,d,f;e((()=>{n(),r(),a={title:`Organisms/Settings/DataImportExecutionStatus`,component:i},o={name:`全部成功`,args:{result:{details:[],failureCount:0,createdPlaceholderCount:0,holderMissingCount:0,successCount:80}}},s={name:`全部成功并新建了待邀请成员`,args:{result:{details:[],failureCount:0,createdPlaceholderCount:2,holderMissingCount:0,successCount:80}}},c={...s,name:`全部成功并新建了待邀请成员（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},l={name:`成功、失败与未匹配持有人混合`,args:{result:{details:[{reason:t.childCategoryRequired(`餐饮`),rowNumbers:[12],sheet:`incomeExpense`,status:`failed`},{reason:t.holderMissingWarning(`小明`),rowNumbers:[22],sheet:`incomeExpense`,status:`holderMissing`}],failureCount:1,createdPlaceholderCount:0,holderMissingCount:1,successCount:79}}},u={name:`余额变更成功与失败汇总`,args:{result:{successCount:2,failureCount:1,createdPlaceholderCount:0,holderMissingCount:0,details:[{sheet:`balanceAdjustment`,rowNumbers:[4],status:`failed`,reason:`该账户已归档，无法导入余额变更。`}]}}},d={name:`全部失败`,args:{result:{successCount:0,failureCount:1,holderMissingCount:0,createdPlaceholderCount:0,details:[{sheet:`incomeExpense`,rowNumbers:[2],status:`failed`,reason:`账户已归档，无法导入。`}]}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "全部成功",
  args: {
    result: {
      details: [],
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      successCount: 80
    }
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "全部成功并新建了待邀请成员",
  args: {
    result: {
      details: [],
      failureCount: 0,
      createdPlaceholderCount: 2,
      holderMissingCount: 0,
      successCount: 80
    }
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
  name: "成功、失败与未匹配持有人混合",
  args: {
    result: {
      details: [{
        reason: dataImportExecutionErrorMessages.childCategoryRequired("餐饮"),
        rowNumbers: [12],
        sheet: "incomeExpense",
        status: "failed"
      }, {
        reason: dataImportExecutionErrorMessages.holderMissingWarning("小明"),
        rowNumbers: [22],
        sheet: "incomeExpense",
        status: "holderMissing"
      }],
      failureCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 1,
      successCount: 79
    }
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "余额变更成功与失败汇总",
  args: {
    result: {
      successCount: 2,
      failureCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      details: [{
        sheet: "balanceAdjustment",
        rowNumbers: [4],
        status: "failed",
        reason: "该账户已归档，无法导入余额变更。"
      }]
    }
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "全部失败",
  args: {
    result: {
      successCount: 0,
      failureCount: 1,
      holderMissingCount: 0,
      createdPlaceholderCount: 0,
      details: [{
        sheet: "incomeExpense",
        rowNumbers: [2],
        status: "failed",
        reason: "账户已归档，无法导入。"
      }]
    }
  }
}`,...d.parameters?.docs?.source}}},f=[`AllSucceeded`,`CreatedPlaceholders`,`CreatedPlaceholdersMobile`,`MixedResult`,`BalanceAdjustmentResult`,`AllFailed`]}))();export{d as AllFailed,o as AllSucceeded,u as BalanceAdjustmentResult,s as CreatedPlaceholders,c as CreatedPlaceholdersMobile,l as MixedResult,f as __namedExportsOrder,a as default};