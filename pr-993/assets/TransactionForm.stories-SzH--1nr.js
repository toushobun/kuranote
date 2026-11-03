import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{a as n,h as r,s as i,u as a}from"./iframe-DBKmBv1j.js";import{n as o,t as s}from"./ConfirmDialogProvider-BNDM2408.js";import{n as c,t as l}from"./TransactionForm-BRhMtWz2.js";async function u(){}var d,f,p,m,h,g,_,v,y,b,x,S,C;e((()=>{d=t(),i(),o(),c(),f=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],p=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`交通`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`交通出行`,type:`expense`},{id:`00000000-0000-4000-8000-000000005074`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005003`,parentName:`固定收入`,type:`income`}],m=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`超市`,icon_url:null}],h={title:`Organisms/Transactions/TransactionForm`,component:l,args:{action:u,accountOptions:f,categoryOptions:p,frequentCategoryIds:p.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:m},decorators:[e=>(0,d.jsx)(s,{children:(0,d.jsx)(e,{})})]},g={},_={args:{errorMessage:`新增记账失败。请稍后重试。`}},v={args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},y={account:n(r({method:`standard`,type:`expense`})),merchant:a(r({method:`standard`,type:`expense`}))},b={name:`缺少账户和商家（提示卡片）`,args:{accountOptions:[],merchantOptions:[],setupHrefs:y}},x={name:`只缺商家（提示卡片）`,args:{merchantOptions:[],setupHrefs:y}},S={name:`只缺账户（提示卡片）`,args:{accountOptions:[],setupHrefs:y}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...v.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "缺少账户和商家（提示卡片）",
  args: {
    accountOptions: [],
    merchantOptions: [],
    setupHrefs
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "只缺商家（提示卡片）",
  args: {
    merchantOptions: [],
    setupHrefs
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "只缺账户（提示卡片）",
  args: {
    accountOptions: [],
    setupHrefs
  }
}`,...S.parameters?.docs?.source}}},C=[`Default`,`WithError`,`EmptyOptions`,`MissingAccountAndMerchant`,`MissingMerchant`,`MissingAccount`]}))();export{g as Default,v as EmptyOptions,S as MissingAccount,b as MissingAccountAndMerchant,x as MissingMerchant,_ as WithError,C as __namedExportsOrder,h as default};