import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,m as n,s as r,u as i}from"./iframe-tMSnMkvh.js";import{n as a,t as o}from"./TransactionForm-ChFbI76C.js";async function s(){}var c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{r(),a(),{expect:c,userEvent:l,within:u}=__STORYBOOK_MODULE_TEST__,d=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],f=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`交通`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`交通出行`,type:`expense`},{id:`00000000-0000-4000-8000-000000005074`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005003`,parentName:`固定收入`,type:`income`}],p=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`超市`,icon_url:null}],m={title:`Organisms/Transactions/TransactionForm`,component:o,args:{action:s,accountOptions:d,categoryOptions:f,frequentCategoryIds:f.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:p}},h={},g={args:{initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`记账示例`,transactionAt:`2026-06-05T03:20:10.000Z`,type:`expense`}}},_={args:{initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`980`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`自定义发生时间示例`,transactionAt:`2026-06-01T12:34:56.000Z`,type:`expense`}}},v={args:{formId:`edit-transaction-form`,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`},{amount:`0`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`编辑前已有备注`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},submitLabel:`保存修改`,title:`编辑记账`}},y={args:{formId:`edit-transaction-form`,initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`300000`,categoryId:`00000000-0000-4000-8000-000000005074`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`编辑前已有收入备注`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`},submitLabel:`保存修改`,title:`编辑记账`}},b={id:`00000000-0000-4000-8000-000000000047`,name:`美元账户`,currency:`USD`},x={name:`编辑已保存退款关联的收入并切换为其他币种账户`,args:{accountOptions:[...d,b],formId:`edit-transaction-form`,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`500`,categoryId:`00000000-0000-4000-8000-000000005074`,expectedUpdatedAt:`2026-06-05T03:20:10.000Z`,id:`00000000-0000-4000-8000-000000008001`,refundCandidate:{accountCurrency:`JPY`,amount:`1200`,categoryName:`餐饮`,id:`00000000-0000-4000-8000-000000008002`,parentCategoryName:`食材/调料`,refundedAmount:`500`,remainingRefundableAmount:`700`,transactionAt:`2026-06-01T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`}}],merchantId:`00000000-0000-4000-8000-000000001001`,note:``,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,type:`income`},submitLabel:`保存修改`,title:`编辑记账`},play:async({canvasElement:e})=>{let t=u(e),n=u(e.ownerDocument.body);await l.click(t.getByRole(`combobox`,{name:`账户`})),await l.click(await n.findByRole(`option`,{name:`美元账户（USD）`})),await c(await t.findByText(`该明细已关联退款，账户需与关联明细的币种一致；如需更换为其他币种的账户，请先解除关联。`)).toBeInTheDocument()}},S={args:{errorMessage:`新增记账失败。请稍后重试。`}},C={args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},w={account:t(n(`expense`)),merchant:i(n(`expense`))},T={name:`缺少账户和商家（提示卡片）`,args:{accountOptions:[],merchantOptions:[],setupHrefs:w}},E={name:`只缺商家（提示卡片）`,args:{merchantOptions:[],setupHrefs:w}},D={name:`只缺账户（提示卡片）`,args:{accountOptions:[],setupHrefs:w}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "编辑已保存退款关联的收入并切换为其他币种账户",
  args: {
    accountOptions: [...accountOptions, usdAccount],
    formId: "edit-transaction-form",
    initialValues: {
      accountId: "00000000-0000-4000-8000-000000000045",
      items: [{
        amount: "500",
        categoryId: "00000000-0000-4000-8000-000000005074",
        expectedUpdatedAt: "2026-06-05T03:20:10.000Z",
        id: "00000000-0000-4000-8000-000000008001",
        refundCandidate: {
          accountCurrency: "JPY",
          amount: "1200",
          categoryName: "餐饮",
          id: "00000000-0000-4000-8000-000000008002",
          parentCategoryName: "食材/调料",
          refundedAmount: "500",
          remainingRefundableAmount: "700",
          transactionAt: "2026-06-01T03:20:10.000Z",
          transactionRecordId: "00000000-0000-4000-8000-000000009004"
        }
      }],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "",
      transactionAt: "2026-06-05T03:20:10.000Z",
      transactionRecordId: "00000000-0000-4000-8000-000000009003",
      type: "income"
    },
    submitLabel: "保存修改",
    title: "编辑记账"
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
      name: "美元账户（USD）"
    }));
    await expect(await canvas.findByText("该明细已关联退款，账户需与关联明细的币种一致；如需更换为其他币种的账户，请先解除关联。")).toBeInTheDocument();
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...C.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "缺少账户和商家（提示卡片）",
  args: {
    accountOptions: [],
    merchantOptions: [],
    setupHrefs
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "只缺商家（提示卡片）",
  args: {
    merchantOptions: [],
    setupHrefs
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "只缺账户（提示卡片）",
  args: {
    accountOptions: [],
    setupHrefs
  }
}`,...D.parameters?.docs?.source}}},O=[`Default`,`WithTags`,`CustomDateTime`,`EditMode`,`EditIncomeMode`,`EditIncomeWithSavedRefundLink`,`WithError`,`EmptyOptions`,`MissingAccountAndMerchant`,`MissingMerchant`,`MissingAccount`]}))();export{_ as CustomDateTime,h as Default,y as EditIncomeMode,x as EditIncomeWithSavedRefundLink,v as EditMode,C as EmptyOptions,D as MissingAccount,T as MissingAccountAndMerchant,E as MissingMerchant,S as WithError,g as WithTags,O as __namedExportsOrder,m as default};