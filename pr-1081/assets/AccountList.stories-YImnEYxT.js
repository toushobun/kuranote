import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,t as n}from"./accounts-xUbHAqfQ.js";import{n as r,t as i}from"./AccountList-BrQ0BY9p.js";var a,o,s,c,l,u,d,f;e((()=>{t(),r(),a=[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`日元现金`,type:`cash`,currency:`JPY`,initial_balance:1e4,current_balance:4560,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,has_transactions:!1,holders:[]},{id:`00000000-0000-4000-8000-000000000003`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]}],o={title:`Organisms/Accounts/AccountList`,component:i,args:{accounts:a}},s={name:`账户列表`},c={name:`空列表`,args:{accounts:[]}},l={name:`筛选后无结果`,args:{accounts:[],emptyTitle:`该类型下还没有账户`,emptyDescription:`请切换其他账户类型，或新增一个账户。`}},u={name:`多账户列表`,args:{accounts:[...a,{id:`00000000-0000-4000-8000-000000000004`,name:`招商银行信用卡`,type:`credit_card`,currency:`CNY`,initial_balance:0,current_balance:-5200,sort_order:4,created_at:`2026-01-04T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-3`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null},{id:`holder-4`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000005`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:5,created_at:`2026-01-05T00:00:00.000Z`,has_transactions:!1,holders:[]}]}},d={name:`带网站图标的账户`,args:{accounts:[{...o.args.accounts[0],...n},...o.args.accounts.slice(1)]}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "账户列表"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "空列表",
  args: {
    accounts: []
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "筛选后无结果",
  args: {
    accounts: [],
    emptyTitle: "该类型下还没有账户",
    emptyDescription: "请切换其他账户类型，或新增一个账户。"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
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
      has_transactions: false,
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
      }, {
        id: "holder-4",
        user_id: "user-2",
        kind: "member" as const,
        placeholder_id: null,
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
      has_transactions: false,
      holders: []
    }]
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "带网站图标的账户",
  args: {
    accounts: [{
      ...meta.args.accounts[0]!,
      ...accountWebsiteIconFixture
    }, ...meta.args.accounts.slice(1)]
  }
}`,...d.parameters?.docs?.source}}},f=[`Default`,`Empty`,`FilteredEmpty`,`ManyAccounts`,`WebsiteIcons`]}))();export{s as Default,c as Empty,l as FilteredEmpty,u as ManyAccounts,d as WebsiteIcons,f as __namedExportsOrder,o as default};