import{i as e}from"./preload-helper-D2yxXLVK.js";import{h as t,t as n}from"./dataImport-Bp_MYdVO.js";import{n as r,t as i}from"./DataImportExecutionStatus-CXVRlSzl.js";var a,o,s,c,l,u,d,f,p;e((()=>{n(),r(),a={title:`Organisms/Settings/DataImportExecutionStatus`,component:i},o={name:`导入中`,args:{result:{details:[],failureCount:0,createdPlaceholderCount:0,holderMissingCount:0,successCount:36},status:`importing`}},s={...o,name:`导入中（上传小票照片）`,args:{...o.args,photoUploadProgress:{done:12,total:80}}},c={name:`全部成功`,args:{result:{details:[],failureCount:0,createdPlaceholderCount:0,holderMissingCount:0,successCount:80},status:`completed`}},l={name:`全部成功并新建了待邀请成员`,args:{result:{details:[],failureCount:0,createdPlaceholderCount:2,holderMissingCount:0,successCount:80},status:`completed`}},u={...l,name:`全部成功并新建了待邀请成员（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},d={name:`成功、失败与未匹配持有人混合`,args:{result:{details:[{content:`2026-09-17 业务超市 1200`,reason:t.childCategoryRequired(`餐饮`),rowNumbers:[12],sheet:`incomeExpense`,status:`failed`},{content:`2026-09-17 全家便利店 600`,reason:t.holderMissingWarning(`小明`),rowNumbers:[22],sheet:`incomeExpense`,status:`holderMissing`}],failureCount:1,createdPlaceholderCount:0,holderMissingCount:1,successCount:79},status:`completed`}},f={name:`余额变更成功与失败汇总`,args:{status:`completed`,result:{successCount:2,failureCount:1,createdPlaceholderCount:0,holderMissingCount:0,details:[{sheet:`balanceAdjustment`,rowNumbers:[4],content:`2026-01-05 已归档账户 +50`,status:`failed`,reason:`该账户已归档，无法导入余额变更。`}]}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "导入中",
  args: {
    result: {
      details: [],
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      successCount: 36
    },
    status: "importing"
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  ...Importing,
  name: "导入中（上传小票照片）",
  args: {
    ...Importing.args,
    photoUploadProgress: {
      done: 12,
      total: 80
    }
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "全部成功",
  args: {
    result: {
      details: [],
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      successCount: 80
    },
    status: "completed"
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "全部成功并新建了待邀请成员",
  args: {
    result: {
      details: [],
      failureCount: 0,
      createdPlaceholderCount: 2,
      holderMissingCount: 0,
      successCount: 80
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
  name: "成功、失败与未匹配持有人混合",
  args: {
    result: {
      details: [{
        content: "2026-09-17 业务超市 1200",
        reason: dataImportExecutionErrorMessages.childCategoryRequired("餐饮"),
        rowNumbers: [12],
        sheet: "incomeExpense",
        status: "failed"
      }, {
        content: "2026-09-17 全家便利店 600",
        reason: dataImportExecutionErrorMessages.holderMissingWarning("小明"),
        rowNumbers: [22],
        sheet: "incomeExpense",
        status: "holderMissing"
      }],
      failureCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 1,
      successCount: 79
    },
    status: "completed"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "余额变更成功与失败汇总",
  args: {
    status: "completed",
    result: {
      successCount: 2,
      failureCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      details: [{
        sheet: "balanceAdjustment",
        rowNumbers: [4],
        content: "2026-01-05 已归档账户 +50",
        status: "failed",
        reason: "该账户已归档，无法导入余额变更。"
      }]
    }
  }
}`,...f.parameters?.docs?.source}}},p=[`Importing`,`UploadingPhotos`,`AllSucceeded`,`CreatedPlaceholders`,`CreatedPlaceholdersMobile`,`MixedResult`,`BalanceAdjustmentResult`]}))();export{c as AllSucceeded,f as BalanceAdjustmentResult,l as CreatedPlaceholders,u as CreatedPlaceholdersMobile,o as Importing,d as MixedResult,s as UploadingPhotos,p as __namedExportsOrder,a as default};