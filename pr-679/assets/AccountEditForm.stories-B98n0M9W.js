import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-Csy12cHf.js";import{r as i,t as a}from"./AccountEditForm-BvR8STFM.js";var o,s,c,l,u,d,f,p,m,h;e((()=>{o=t(),n(),i(),s=[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],c={id:`account-1`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:0,created_at:`2026-06-03T00:00:00.000Z`},l={component:a,decorators:[e=>(0,o.jsx)(r,{storageScope:`storybook-account-edit-form`,children:(0,o.jsx)(e,{})})],title:`Organisms/Accounts/AccountEditForm`},u={name:`单人持有账户`,args:{account:{...c,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},holderOptions:s,updateAccountAction:async()=>{}}},d={name:`多人共同持有账户`,args:{account:{...c,name:`日元现金`,type:`cash`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},holderOptions:s,updateAccountAction:async()=>{}}},f={name:`未设置持有人账户`,args:{account:{...c,name:`备用账户`,type:`other`,holders:[]},holderOptions:s,updateAccountAction:async()=>{}}},p={name:`带删除按钮`,args:{account:{...c,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},archiveAccountAction:async()=>{},holderOptions:s,updateAccountAction:async()=>{}}},m={name:`保留非活跃持有人`,args:{account:{...c,name:`旧信用卡`,type:`credit_card`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null},{id:`holder-3`,user_id:`user-3`,display_name:`停用用户`,email:`inactive@example.test`,display_color:`amber`,role:`co_owner`,share_ratio:null}]},holderOptions:s,updateAccountAction:async()=>{}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "单人持有账户",
  args: {
    account: {
      ...baseAccount,
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null
      }]
    },
    holderOptions,
    updateAccountAction: async () => {}
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "多人共同持有账户",
  args: {
    account: {
      ...baseAccount,
      name: "日元现金",
      type: "cash",
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "co_owner",
        share_ratio: null
      }, {
        id: "holder-2",
        user_id: "user-2",
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "co_owner",
        share_ratio: null
      }]
    },
    holderOptions,
    updateAccountAction: async () => {}
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "未设置持有人账户",
  args: {
    account: {
      ...baseAccount,
      name: "备用账户",
      type: "other",
      holders: []
    },
    holderOptions,
    updateAccountAction: async () => {}
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "带删除按钮",
  args: {
    account: {
      ...baseAccount,
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null
      }]
    },
    archiveAccountAction: async () => {},
    holderOptions,
    updateAccountAction: async () => {}
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "保留非活跃持有人",
  args: {
    account: {
      ...baseAccount,
      name: "旧信用卡",
      type: "credit_card",
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null
      }, {
        id: "holder-3",
        user_id: "user-3",
        display_name: "停用用户",
        email: "inactive@example.test",
        display_color: "amber",
        role: "co_owner",
        share_ratio: null
      }]
    },
    holderOptions,
    updateAccountAction: async () => {}
  }
}`,...m.parameters?.docs?.source}}},h=[`SingleHolderAccount`,`SharedHolderAccount`,`NoHolderAccount`,`WithArchiveAction`,`InactiveHolderPreserved`]}))();export{m as InactiveHolderPreserved,f as NoHolderAccount,d as SharedHolderAccount,u as SingleHolderAccount,p as WithArchiveAction,h as __namedExportsOrder,l as default};