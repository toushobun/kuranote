import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{f as n,i as r,n as i,s as a}from"./paths-D3rhNSa3.js";import{n as o,t as s}from"./ConfirmDialogProvider-DfBxIBr0.js";import{n as c,t as l}from"./TransactionForm-DRSQnKd2.js";async function u(){}var d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D;e((()=>{d=t(),r(),o(),c(),{expect:f,userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],g=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`交通`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`交通出行`,type:`expense`},{id:`00000000-0000-4000-8000-000000005074`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005003`,parentName:`固定收入`,type:`income`}],_=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`超市`,icon_url:null}],v={title:`Organisms/Transactions/TransactionForm`,component:l,args:{action:u,accountOptions:h,categoryOptions:g,frequentCategoryIds:g.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:_},decorators:[e=>(0,d.jsx)(s,{children:(0,d.jsx)(e,{})})]},y={},b={args:{errorMessage:`新增记账失败。请稍后重试。`}},x={args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},S={account:i(n({method:`standard`,type:`expense`})),merchant:a(n({method:`standard`,type:`expense`}))},C={name:`缺少账户和商家（提示卡片）`,args:{accountOptions:[],merchantOptions:[],setupHrefs:S}},w={name:`只缺商家（提示卡片）`,args:{merchantOptions:[],setupHrefs:S}},T={name:`只缺账户（提示卡片）`,args:{accountOptions:[],setupHrefs:S}},E={name:`纯收入：添加第二个收款账户`,args:{initialType:`income`,multiAccountPaymentEnabled:!0},play:async({canvasElement:e})=>{let t=m(e),n=m(e.ownerDocument.body);await p.click(t.getByRole(`combobox`,{name:`账户`})),await p.click(await n.findByRole(`option`,{name:`日元现金（JPY）`})),await p.click(t.getByRole(`button`,{name:`添加明细`})),await p.click(await n.findByRole(`button`,{name:`固定收入 · 工资`})),await p.type(n.getByRole(`textbox`,{name:`金额`}),`10000`),await p.click(n.getByRole(`button`,{name:`确定`})),await p.click(n.getByRole(`button`,{name:`关闭`})),await p.click(await t.findByRole(`button`,{name:`添加收款账户`})),await p.click(t.getByRole(`combobox`,{name:`收款账户 2`})),await p.click(await n.findByRole(`option`,{name:`三井住友银行（JPY）`})),await f(t.getByRole(`status`)).toHaveTextContent(`收款合计 ¥10,000 / 明细合计 ¥10,000`)}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...x.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "缺少账户和商家（提示卡片）",
  args: {
    accountOptions: [],
    merchantOptions: [],
    setupHrefs
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "只缺商家（提示卡片）",
  args: {
    merchantOptions: [],
    setupHrefs
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "只缺账户（提示卡片）",
  args: {
    accountOptions: [],
    setupHrefs
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "纯收入：添加第二个收款账户",
  args: {
    initialType: "income",
    multiAccountPaymentEnabled: true
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("combobox", {
      name: "账户"
    }));
    await userEvent.click(await body.findByRole("option", {
      name: "日元现金（JPY）"
    }));
    await userEvent.click(canvas.getByRole("button", {
      name: "添加明细"
    }));
    await userEvent.click(await body.findByRole("button", {
      name: "固定收入 · 工资"
    }));
    await userEvent.type(body.getByRole("textbox", {
      name: "金额"
    }), "10000");
    await userEvent.click(body.getByRole("button", {
      name: "确定"
    }));
    await userEvent.click(body.getByRole("button", {
      name: "关闭"
    }));
    await userEvent.click(await canvas.findByRole("button", {
      name: "添加收款账户"
    }));
    await userEvent.click(canvas.getByRole("combobox", {
      name: "收款账户 2"
    }));
    await userEvent.click(await body.findByRole("option", {
      name: "三井住友银行（JPY）"
    }));
    await expect(canvas.getByRole("status")).toHaveTextContent("收款合计 ¥10,000 / 明细合计 ¥10,000");
  }
}`,...E.parameters?.docs?.source}}},D=[`Default`,`WithError`,`EmptyOptions`,`MissingAccountAndMerchant`,`MissingMerchant`,`MissingAccount`,`MultiAccountIncome`]}))();export{y as Default,x as EmptyOptions,T as MissingAccount,C as MissingAccountAndMerchant,w as MissingMerchant,E as MultiAccountIncome,b as WithError,D as __namedExportsOrder,v as default};