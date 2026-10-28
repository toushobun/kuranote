import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./accountHolders-C9qAxdDY.js";import{n as i,t as a}from"./ConfirmDialogProvider-zBQA2t0e.js";import{r as o,t as s}from"./AccountEditForm-B8ErqdSt.js";var c,l,u,d,f,p,m,h,g,_,v,y,b,x;e((()=>{c=t(),i(),n(),o(),l=[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],u={id:`account-1`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:0,created_at:`2026-06-03T00:00:00.000Z`,has_transactions:!1},d={component:s,decorators:[e=>(0,c.jsx)(a,{children:(0,c.jsx)(e,{})})],title:`Organisms/Accounts/AccountEditForm`},f={name:`单人持有账户`,args:{account:{...u,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},holderOptions:l,updateAccountAction:async()=>{}}},p={name:`存量数据：多人共同持有账户（仅预选第一个持有人）`,args:{account:{...u,name:`日元现金`,type:`cash`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},holderOptions:l,updateAccountAction:async()=>{}}},m={name:`未设置持有人账户`,args:{account:{...u,name:`备用账户`,type:`other`,holders:[]},holderOptions:l,updateAccountAction:async()=>{}}},h={name:`已有交易、币种禁用`,args:{account:{...u,has_transactions:!0,holders:[]},holderOptions:l,updateAccountAction:async()=>{}}},g={name:`带删除按钮`,args:{account:{...u,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},archiveAccountAction:async()=>{},holderOptions:l,updateAccountAction:async()=>{}}},_={name:`保留非活跃持有人`,args:{account:{...u,name:`旧信用卡`,type:`credit_card`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null},{id:`holder-3`,user_id:`user-3`,kind:`member`,placeholder_id:null,display_name:`停用用户`,email:`inactive@example.test`,display_color:`amber`,role:`co_owner`,share_ratio:null}]},holderOptions:l,updateAccountAction:async()=>{}}},v=r(),y={name:`待邀请成员持有的账户（三态持有人）`,args:{account:{...u,holders:[v]},holderOptions:l,placeholderHolderOptions:[{display_name:v.display_name,placeholder_id:v.placeholder_id},{display_name:`爷爷`,placeholder_id:`placeholder-2`}],updateAccountAction:async()=>{}}},b={...y,name:`待邀请成员持有的账户（移动端）`,parameters:{viewport:{defaultViewport:`mobile2`}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
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
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
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
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
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
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "已有交易、币种禁用",
  args: {
    account: {
      ...baseAccount,
      has_transactions: true,
      holders: []
    },
    holderOptions,
    updateAccountAction: async () => {}
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  ...PlaceholderHolderAccount,
  name: "待邀请成员持有的账户（移动端）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...b.parameters?.docs?.source}}},x=[`SingleHolderAccount`,`SharedHolderAccount`,`NoHolderAccount`,`CurrencyLockedAccount`,`WithArchiveAction`,`InactiveHolderPreserved`,`PlaceholderHolderAccount`,`PlaceholderHolderAccountMobile`]}))();export{h as CurrencyLockedAccount,_ as InactiveHolderPreserved,m as NoHolderAccount,y as PlaceholderHolderAccount,b as PlaceholderHolderAccountMobile,p as SharedHolderAccount,f as SingleHolderAccount,g as WithArchiveAction,x as __namedExportsOrder,d as default};