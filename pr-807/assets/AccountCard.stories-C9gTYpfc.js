import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./accountHolders-C9qAxdDY.js";import{n as r,t as i}from"./AccountCard-BiEbwSjC.js";var a,o,s,c,l,u,d,f,p,m,h,g;e((()=>{t(),r(),a={component:i,title:`Molecules/Accounts/AccountCard`},o={name:`银行卡`,args:{name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,currentBalance:85e3,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]}},s={name:`共同持有现金账户`,args:{name:`日元现金`,type:`cash`,currency:`JPY`,currentBalance:4560,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]}},c={name:`未设置持有人`,args:{name:`未分类账户`,type:`other`,currency:`JPY`,currentBalance:0,holders:[]}},l={name:`信用卡`,args:{name:`楽天カード`,type:`credit_card`,currency:`JPY`,currentBalance:-12500,holders:[{id:`holder-3`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]}},u={name:`电子钱包`,args:{name:`PayPay`,type:`e_money`,currency:`JPY`,currentBalance:3200,holders:[{id:`holder-4`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]}},d={name:`其他类型账户`,args:{name:`备用账户`,type:`other`,currency:`CNY`,currentBalance:500,holders:[{id:`holder-5`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]}},f={name:`外币账户`,args:{name:`美元储蓄`,type:`bank`,currency:`USD`,currentBalance:12800,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]}},p={name:`负余额（信用卡欠款）`,args:{name:`招商银行信用卡`,type:`credit_card`,currency:`CNY`,currentBalance:-8600,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]}},m={name:`可点击卡片`,args:{name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,currentBalance:85e3,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}],onClick:()=>{}}},h={name:`待邀请成员持有的账户`,args:{name:`奶奶的钱包`,type:`cash`,currency:`JPY`,currentBalance:12e3,holders:[n()]}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "银行卡",
  args: {
    name: "三菱UFJ银行",
    type: "bank",
    currency: "JPY",
    currentBalance: 85000,
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
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "共同持有现金账户",
  args: {
    name: "日元现金",
    type: "cash",
    currency: "JPY",
    currentBalance: 4560,
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
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "未设置持有人",
  args: {
    name: "未分类账户",
    type: "other",
    currency: "JPY",
    currentBalance: 0,
    holders: []
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "信用卡",
  args: {
    name: "楽天カード",
    type: "credit_card",
    currency: "JPY",
    currentBalance: -12500,
    holders: [{
      id: "holder-3",
      user_id: "user-1",
      kind: "member" as const,
      placeholder_id: null,
      display_name: "本地开发用户",
      email: "local1@example.test",
      display_color: "sky",
      role: "owner",
      share_ratio: null
    }]
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "电子钱包",
  args: {
    name: "PayPay",
    type: "e_money",
    currency: "JPY",
    currentBalance: 3200,
    holders: [{
      id: "holder-4",
      user_id: "user-2",
      kind: "member" as const,
      placeholder_id: null,
      display_name: "本地开发用户2",
      email: "local2@example.test",
      display_color: "sakura",
      role: "owner",
      share_ratio: null
    }]
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "其他类型账户",
  args: {
    name: "备用账户",
    type: "other",
    currency: "CNY",
    currentBalance: 500,
    holders: [{
      id: "holder-5",
      user_id: "user-1",
      kind: "member" as const,
      placeholder_id: null,
      display_name: "本地开发用户",
      email: "local1@example.test",
      display_color: "sky",
      role: "owner",
      share_ratio: null
    }]
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "外币账户",
  args: {
    name: "美元储蓄",
    type: "bank",
    currency: "USD",
    currentBalance: 12800,
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
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "负余额（信用卡欠款）",
  args: {
    name: "招商银行信用卡",
    type: "credit_card",
    currency: "CNY",
    currentBalance: -8600,
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
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "可点击卡片",
  args: {
    name: "三菱UFJ银行",
    type: "bank",
    currency: "JPY",
    currentBalance: 85000,
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
    }],
    onClick: () => {}
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "待邀请成员持有的账户",
  args: {
    name: "奶奶的钱包",
    type: "cash",
    currency: "JPY",
    currentBalance: 12000,
    holders: [createPlaceholderAccountHolder()]
  }
}`,...h.parameters?.docs?.source}}},g=[`BankAccount`,`SharedCashAccount`,`AccountWithoutHolder`,`CreditCard`,`EMoney`,`OtherType`,`ForeignCurrency`,`NegativeBalance`,`Clickable`,`PlaceholderHolderAccount`]}))();export{c as AccountWithoutHolder,o as BankAccount,m as Clickable,l as CreditCard,u as EMoney,f as ForeignCurrency,p as NegativeBalance,d as OtherType,h as PlaceholderHolderAccount,s as SharedCashAccount,g as __namedExportsOrder,a as default};