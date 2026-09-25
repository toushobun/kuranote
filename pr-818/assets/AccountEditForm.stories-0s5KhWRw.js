import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-BmU6W3qi.js";import{n as i,t as a}from"./accountHolders-C9qAxdDY.js";import{n as o,t as s}from"./ConfirmDialogProvider-D5FXtFsh.js";import{r as c,t as l}from"./AccountEditForm-amYZsYpF.js";var u,d,f,p,m,h,g,_,v,y,b,x,S;e((()=>{u=t(),o(),n(),i(),c(),d=[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],f={id:`account-1`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:0,created_at:`2026-06-03T00:00:00.000Z`},p={component:l,decorators:[e=>(0,u.jsx)(r,{storageScope:`storybook-account-edit-form`,children:(0,u.jsx)(s,{children:(0,u.jsx)(e,{})})})],title:`Organisms/Accounts/AccountEditForm`},m={name:`单人持有账户`,args:{account:{...f,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},holderOptions:d,updateAccountAction:async()=>{}}},h={name:`存量数据：多人共同持有账户（仅预选第一个持有人）`,args:{account:{...f,name:`日元现金`,type:`cash`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},holderOptions:d,updateAccountAction:async()=>{}}},g={name:`未设置持有人账户`,args:{account:{...f,name:`备用账户`,type:`other`,holders:[]},holderOptions:d,updateAccountAction:async()=>{}}},_={name:`带删除按钮`,args:{account:{...f,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},archiveAccountAction:async()=>{},holderOptions:d,updateAccountAction:async()=>{}}},v={name:`保留非活跃持有人`,args:{account:{...f,name:`旧信用卡`,type:`credit_card`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null},{id:`holder-3`,user_id:`user-3`,kind:`member`,placeholder_id:null,display_name:`停用用户`,email:`inactive@example.test`,display_color:`amber`,role:`co_owner`,share_ratio:null}]},holderOptions:d,updateAccountAction:async()=>{}}},y=a(),b={name:`待邀请成员持有的账户（三态持有人）`,args:{account:{...f,holders:[y]},holderOptions:d,placeholderHolderOptions:[{display_name:y.display_name,placeholder_id:y.placeholder_id},{display_name:`爷爷`,placeholder_id:`placeholder-2`}],updateAccountAction:async()=>{}}},x={...b,name:`待邀请成员持有的账户（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "单人持有账户",
  args: {
    account: {
      ...baseAccount,
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        kind: "member" as const,
        placeholder_id: null,
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
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "存量数据：多人共同持有账户（仅预选第一个持有人）",
  args: {
    account: {
      ...baseAccount,
      name: "日元现金",
      type: "cash",
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        kind: "member" as const,
        placeholder_id: null,
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "co_owner",
        share_ratio: null
      }, {
        id: "holder-2",
        user_id: "user-2",
        kind: "member" as const,
        placeholder_id: null,
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
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "带删除按钮",
  args: {
    account: {
      ...baseAccount,
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        kind: "member" as const,
        placeholder_id: null,
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
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "保留非活跃持有人",
  args: {
    account: {
      ...baseAccount,
      name: "旧信用卡",
      type: "credit_card",
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        kind: "member" as const,
        placeholder_id: null,
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null
      }, {
        id: "holder-3",
        user_id: "user-3",
        kind: "member" as const,
        placeholder_id: null,
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
}`,...v.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "待邀请成员持有的账户（三态持有人）",
  args: {
    account: {
      ...baseAccount,
      holders: [placeholderHolder]
    },
    holderOptions,
    placeholderHolderOptions: [{
      display_name: placeholderHolder.display_name,
      placeholder_id: placeholderHolder.placeholder_id
    }, {
      display_name: "爷爷",
      placeholder_id: "placeholder-2"
    }],
    updateAccountAction: async () => {}
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  ...PlaceholderHolderAccount,
  name: "待邀请成员持有的账户（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...x.parameters?.docs?.source}}},S=[`SingleHolderAccount`,`SharedHolderAccount`,`NoHolderAccount`,`WithArchiveAction`,`InactiveHolderPreserved`,`PlaceholderHolderAccount`,`PlaceholderHolderAccountMobile`]}))();export{v as InactiveHolderPreserved,g as NoHolderAccount,b as PlaceholderHolderAccount,x as PlaceholderHolderAccountMobile,h as SharedHolderAccount,m as SingleHolderAccount,_ as WithArchiveAction,S as __namedExportsOrder,p as default};