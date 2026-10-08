import{i as e}from"./preload-helper-D2yxXLVK.js";import{d as t,i as n,n as r,s as i}from"./paths-D7uT-HPS.js";import{n as a,t as o}from"./TransactionForm-CYqyHaKJ.js";async function s(){}var c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C;e((()=>{n(),a(),c=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],l=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`交通`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`交通出行`,type:`expense`},{id:`00000000-0000-4000-8000-000000005074`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005003`,parentName:`固定收入`,type:`income`}],u=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`超市`,icon_url:null}],d={title:`Organisms/Transactions/TransactionForm`,component:o,args:{action:s,accountOptions:c,categoryOptions:l,frequentCategoryIds:l.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:u}},f={},p={args:{initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`记账示例`,transactionAt:`2026-06-05T03:20:10.000Z`,type:`expense`}}},m={args:{initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`980`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`自定义发生时间示例`,transactionAt:`2026-06-01T12:34:56.000Z`,type:`expense`}}},h={args:{formId:`edit-transaction-form`,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`},{amount:`0`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`编辑前已有备注`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},submitLabel:`保存修改`,title:`编辑记账`}},g={args:{formId:`edit-transaction-form`,initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`300000`,categoryId:`00000000-0000-4000-8000-000000005074`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`编辑前已有收入备注`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`},submitLabel:`保存修改`,title:`编辑记账`}},_={args:{errorMessage:`新增记账失败。请稍后重试。`}},v={args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},y={account:r(t(`expense`)),merchant:i(t(`expense`))},b={name:`缺少账户和商家（提示卡片）`,args:{accountOptions:[],merchantOptions:[],setupHrefs:y}},x={name:`只缺商家（提示卡片）`,args:{merchantOptions:[],setupHrefs:y}},S={name:`只缺账户（提示卡片）`,args:{accountOptions:[],setupHrefs:y}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    initialValues: {
      accountId: "00000000-0000-4000-8000-000000000045",
      items: [{
        amount: "1200",
        categoryId: "00000000-0000-4000-8000-000000005072"
      }],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "记账示例",
      transactionAt: "2026-06-05T03:20:10.000Z",
      type: "expense"
    }
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    initialValues: {
      accountId: "00000000-0000-4000-8000-000000000046",
      items: [{
        amount: "980",
        categoryId: "00000000-0000-4000-8000-000000005073"
      }],
      merchantId: "00000000-0000-4000-8000-000000001002",
      note: "自定义发生时间示例",
      transactionAt: "2026-06-01T12:34:56.000Z",
      type: "expense"
    }
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    formId: "edit-transaction-form",
    initialValues: {
      accountId: "00000000-0000-4000-8000-000000000045",
      items: [{
        amount: "1200",
        categoryId: "00000000-0000-4000-8000-000000005072"
      }, {
        amount: "0",
        categoryId: "00000000-0000-4000-8000-000000005073"
      }],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "编辑前已有备注",
      transactionAt: "2026-06-05T03:20:10.000Z",
      transactionRecordId: "00000000-0000-4000-8000-000000009001",
      type: "expense"
    },
    submitLabel: "保存修改",
    title: "编辑记账"
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    formId: "edit-transaction-form",
    initialValues: {
      accountId: "00000000-0000-4000-8000-000000000046",
      items: [{
        amount: "300000",
        categoryId: "00000000-0000-4000-8000-000000005074"
      }],
      merchantId: "00000000-0000-4000-8000-000000001002",
      note: "编辑前已有收入备注",
      transactionAt: "2026-06-05T03:20:10.000Z",
      transactionRecordId: "00000000-0000-4000-8000-000000009002",
      type: "income"
    },
    submitLabel: "保存修改",
    title: "编辑记账"
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}},C=[`Default`,`WithTags`,`CustomDateTime`,`EditMode`,`EditIncomeMode`,`WithError`,`EmptyOptions`,`MissingAccountAndMerchant`,`MissingMerchant`,`MissingAccount`]}))();export{m as CustomDateTime,f as Default,g as EditIncomeMode,h as EditMode,v as EmptyOptions,S as MissingAccount,b as MissingAccountAndMerchant,x as MissingMerchant,_ as WithError,p as WithTags,C as __namedExportsOrder,d as default};