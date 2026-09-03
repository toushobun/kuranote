import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./AccountSummaryCard-B2VSxRpl.js";var r,i,a,o,s,c,l,u;e((()=>{t(),r=[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],i={component:n,title:`Organisms/Accounts/AccountSummaryCard`},a={name:`账户总览`,args:{accounts:r,baseCurrency:`JPY`}},o={name:`无账户`,args:{accounts:[],baseCurrency:`JPY`}},s={name:`总余额为负（信用卡为主）`,args:{baseCurrency:`JPY`,accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12e4,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}]}},c={name:`存在外币账户`,args:{baseCurrency:`JPY`,accounts:[...r,{id:`00000000-0000-4000-8000-000000000003`,name:`美元账户`,type:`bank`,currency:`USD`,initial_balance:0,current_balance:500,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},l={name:`多位持有人`,args:{baseCurrency:`JPY`,accounts:[{...r[0],holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},r[1]]}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "账户总览",
  args: {
    accounts,
    baseCurrency: "JPY"
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "无账户",
  args: {
    accounts: [],
    baseCurrency: "JPY"
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "总余额为负（信用卡为主）",
  args: {
    baseCurrency: "JPY",
    accounts: [{
      id: "00000000-0000-4000-8000-000000000001",
      name: "楽天カード",
      type: "credit_card",
      currency: "JPY",
      initial_balance: 0,
      current_balance: -120000,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z",
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null
      }]
    }, {
      id: "00000000-0000-4000-8000-000000000002",
      name: "PayPay",
      type: "e_money",
      currency: "JPY",
      initial_balance: 0,
      current_balance: 3200,
      sort_order: 2,
      created_at: "2026-01-02T00:00:00.000Z",
      holders: []
    }]
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "存在外币账户",
  args: {
    baseCurrency: "JPY",
    accounts: [...accounts, {
      id: "00000000-0000-4000-8000-000000000003",
      name: "美元账户",
      type: "bank",
      currency: "USD",
      initial_balance: 0,
      current_balance: 500,
      sort_order: 3,
      created_at: "2026-01-03T00:00:00.000Z",
      holders: []
    }]
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "多位持有人",
  args: {
    baseCurrency: "JPY",
    accounts: [{
      ...accounts[0],
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
    }, accounts[1]]
  }
}`,...l.parameters?.docs?.source}}},u=[`Default`,`Empty`,`NegativeTotal`,`WithForeignCurrencyAccount`,`MultipleHolders`]}))();export{a as Default,o as Empty,l as MultipleHolders,s as NegativeTotal,c as WithForeignCurrencyAccount,u as __namedExportsOrder,i as default};