import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionForm-wbmX_Ed-.js";async function r(){}var i,a,o,s,c,l,u,d,f,p,m,h;e((()=>{t(),i=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],a=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`交通`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`交通出行`,type:`expense`},{id:`00000000-0000-4000-8000-000000005074`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005003`,parentName:`固定收入`,type:`income`}],o=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`超市`,icon_url:null}],s={title:`Organisms/Transactions/TransactionForm`,component:n,args:{action:r,accountOptions:i,categoryOptions:a,frequentCategoryIds:a.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:o}},c={},l={args:{initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`记账示例`,transactionAt:`2026-06-05T03:20:10.000Z`,type:`expense`}}},u={args:{initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`980`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`自定义发生时间示例`,transactionAt:`2026-06-01T12:34:56.000Z`,type:`expense`}}},d={args:{formId:`edit-transaction-form`,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`},{amount:`0`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`编辑前已有备注`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},submitLabel:`保存修改`,title:`编辑记账`}},f={args:{formId:`edit-transaction-form`,initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`300000`,categoryId:`00000000-0000-4000-8000-000000005074`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`编辑前已有收入备注`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`},submitLabel:`保存修改`,title:`编辑记账`}},p={args:{errorMessage:`新增记账失败。请稍后重试。`}},m={args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
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
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
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
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
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
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
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
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`WithTags`,`CustomDateTime`,`EditMode`,`EditIncomeMode`,`WithError`,`EmptyOptions`]}))();export{u as CustomDateTime,c as Default,f as EditIncomeMode,d as EditMode,m as EmptyOptions,p as WithError,l as WithTags,h as __namedExportsOrder,s as default};