import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./AccountList-DfKFdUVd.js";var r,i,a,o,s,c,l,u;e((()=>{t(),r=[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],i=[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`日元现金`,type:`cash`,currency:`JPY`,initial_balance:1e4,current_balance:4560,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]},{id:`00000000-0000-4000-8000-000000000003`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[{id:`holder-2`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]}],a={title:`Organisms/Accounts/AccountList`,component:n,args:{accounts:i,holderOptions:r,archiveAccountAction:async()=>{},updateAccountAction:async()=>{}}},o={name:`账户列表`},s={name:`空列表`,args:{accounts:[]}},c={name:`筛选后无结果`,args:{accounts:[],emptyTitle:`该类型下还没有账户`,emptyDescription:`请切换其他账户类型，或新增一个账户。`}},l={name:`多账户列表`,args:{accounts:[...i,{id:`00000000-0000-4000-8000-000000000004`,name:`招商银行信用卡`,type:`credit_card`,currency:`CNY`,initial_balance:0,current_balance:-5200,sort_order:4,created_at:`2026-01-04T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null},{id:`holder-4`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000005`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:5,created_at:`2026-01-05T00:00:00.000Z`,holders:[]}]}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "账户列表"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "空列表",
  args: {
    accounts: []
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "筛选后无结果",
  args: {
    accounts: [],
    emptyTitle: "该类型下还没有账户",
    emptyDescription: "请切换其他账户类型，或新增一个账户。"
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "多账户列表",
  args: {
    accounts: [...accounts, {
      id: "00000000-0000-4000-8000-000000000004",
      name: "招商银行信用卡",
      type: "credit_card",
      currency: "CNY",
      initial_balance: 0,
      current_balance: -5200,
      sort_order: 4,
      created_at: "2026-01-04T00:00:00.000Z",
      holders: [{
        id: "holder-3",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "owner",
        share_ratio: null
      }, {
        id: "holder-4",
        user_id: "user-2",
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "co_owner",
        share_ratio: null
      }]
    }, {
      id: "00000000-0000-4000-8000-000000000005",
      name: "PayPay",
      type: "e_money",
      currency: "JPY",
      initial_balance: 0,
      current_balance: 3200,
      sort_order: 5,
      created_at: "2026-01-05T00:00:00.000Z",
      holders: []
    }]
  }
}`,...l.parameters?.docs?.source}}},u=[`Default`,`Empty`,`FilteredEmpty`,`ManyAccounts`]}))();export{o as Default,s as Empty,c as FilteredEmpty,l as ManyAccounts,u as __namedExportsOrder,a as default};