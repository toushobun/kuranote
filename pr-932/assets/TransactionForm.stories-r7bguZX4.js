import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{a as n,m as r,s as i,u as a}from"./iframe-Cb7IOPpa.js";import{n as o,t as s}from"./ConfirmDialogProvider-CZw9Yypx.js";import{n as c,t as l}from"./TransactionForm-w48FEnjg.js";async function u(){}var d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P;e((()=>{d=t(),i(),o(),c(),{expect:f,userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],g=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`交通`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`交通出行`,type:`expense`},{id:`00000000-0000-4000-8000-000000005074`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005003`,parentName:`固定收入`,type:`income`}],_=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`超市`,icon_url:null}],v={title:`Organisms/Transactions/TransactionForm`,component:l,args:{action:u,accountOptions:h,categoryOptions:g,frequentCategoryIds:g.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:_},decorators:[e=>(0,d.jsx)(s,{children:(0,d.jsx)(e,{})})]},y={},b={args:{initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`记账示例`,transactionAt:`2026-06-05T03:20:10.000Z`,type:`expense`}}},x={args:{initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000046`,amount:null}],items:[{amount:`980`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`自定义发生时间示例`,transactionAt:`2026-06-01T12:34:56.000Z`,type:`expense`}}},S={args:{formId:`edit-transaction-form`,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`},{amount:`0`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`编辑前已有备注`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},submitLabel:`保存修改`,title:`编辑记账`}},C={args:{formId:`edit-transaction-form`,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000046`,amount:null}],items:[{amount:`300000`,categoryId:`00000000-0000-4000-8000-000000005074`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`编辑前已有收入备注`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`},submitLabel:`保存修改`,title:`编辑记账`}},w={name:`多账户付款（收入分类不可选）`,args:{initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:`800`},{accountId:`00000000-0000-4000-8000-000000000046`,amount:`400`}],items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:``,transactionAt:`2026-06-05T03:20:10.000Z`,type:`expense`}}},T={name:`含收入明细时添加付款账户（确认删除收入明细）`,args:{initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`},{amount:`300`,categoryId:`00000000-0000-4000-8000-000000005074`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:``,transactionAt:`2026-06-05T03:20:10.000Z`,type:`expense`}},play:async({canvasElement:e})=>{let t=m(e);await p.click(await t.findByRole(`button`,{name:`添加付款账户`})),await f(await m(e.ownerDocument.body).findByRole(`dialog`,{name:`删除收入明细？`})).toBeInTheDocument()}},E={id:`00000000-0000-4000-8000-000000000047`,name:`美元账户`,currency:`USD`},D={name:`编辑已保存退款关联的收入并切换为其他币种账户`,args:{accountOptions:[...h,E],formId:`edit-transaction-form`,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`500`,categoryId:`00000000-0000-4000-8000-000000005074`,expectedUpdatedAt:`2026-06-05T03:20:10.000Z`,id:`00000000-0000-4000-8000-000000008001`,refundCandidate:{accountCurrency:`JPY`,amount:`1200`,categoryName:`餐饮`,id:`00000000-0000-4000-8000-000000008002`,parentCategoryName:`食材/调料`,refundedAmount:`500`,remainingRefundableAmount:`700`,transactionAt:`2026-06-01T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`}}],merchantId:`00000000-0000-4000-8000-000000001001`,note:``,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,type:`income`},submitLabel:`保存修改`,title:`编辑记账`},play:async({canvasElement:e})=>{let t=m(e),n=m(e.ownerDocument.body);await p.click(t.getByRole(`combobox`,{name:`账户`})),await p.click(await n.findByRole(`option`,{name:`美元账户（USD）`})),await f(await t.findByText(`该明细已关联退款，账户需与关联明细的币种一致；如需更换为其他币种的账户，请先解除关联。`)).toBeInTheDocument()}},O={args:{errorMessage:`新增记账失败。请稍后重试。`}},k={args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},A={account:n(r(`expense`)),merchant:a(r(`expense`))},j={name:`缺少账户和商家（提示卡片）`,args:{accountOptions:[],merchantOptions:[],setupHrefs:A}},M={name:`只缺商家（提示卡片）`,args:{merchantOptions:[],setupHrefs:A}},N={name:`只缺账户（提示卡片）`,args:{accountOptions:[],setupHrefs:A}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    initialValues: {
      payments: [{
        accountId: "00000000-0000-4000-8000-000000000045",
        amount: null
      }],
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
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    initialValues: {
      payments: [{
        accountId: "00000000-0000-4000-8000-000000000046",
        amount: null
      }],
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
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    formId: "edit-transaction-form",
    initialValues: {
      payments: [{
        accountId: "00000000-0000-4000-8000-000000000045",
        amount: null
      }],
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
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    formId: "edit-transaction-form",
    initialValues: {
      payments: [{
        accountId: "00000000-0000-4000-8000-000000000046",
        amount: null
      }],
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "多账户付款（收入分类不可选）",
  args: {
    initialValues: {
      payments: [{
        accountId: "00000000-0000-4000-8000-000000000045",
        amount: "800"
      }, {
        accountId: "00000000-0000-4000-8000-000000000046",
        amount: "400"
      }],
      items: [{
        amount: "1200",
        categoryId: "00000000-0000-4000-8000-000000005072"
      }],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "",
      transactionAt: "2026-06-05T03:20:10.000Z",
      type: "expense"
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "含收入明细时添加付款账户（确认删除收入明细）",
  args: {
    initialValues: {
      payments: [{
        accountId: "00000000-0000-4000-8000-000000000045",
        amount: null
      }],
      items: [{
        amount: "1200",
        categoryId: "00000000-0000-4000-8000-000000005072"
      }, {
        amount: "300",
        categoryId: "00000000-0000-4000-8000-000000005074"
      }],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "",
      transactionAt: "2026-06-05T03:20:10.000Z",
      type: "expense"
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "添加付款账户"
    }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole("dialog", {
      name: "删除收入明细？"
    })).toBeInTheDocument();
  }
}`,...T.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "编辑已保存退款关联的收入并切换为其他币种账户",
  args: {
    accountOptions: [...accountOptions, usdAccount],
    formId: "edit-transaction-form",
    initialValues: {
      payments: [{
        accountId: "00000000-0000-4000-8000-000000000045",
        amount: null
      }],
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
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...k.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "缺少账户和商家（提示卡片）",
  args: {
    accountOptions: [],
    merchantOptions: [],
    setupHrefs
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "只缺商家（提示卡片）",
  args: {
    merchantOptions: [],
    setupHrefs
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "只缺账户（提示卡片）",
  args: {
    accountOptions: [],
    setupHrefs
  }
}`,...N.parameters?.docs?.source}}},P=[`Default`,`WithTags`,`CustomDateTime`,`EditMode`,`EditIncomeMode`,`MultiAccountPayment`,`AddPaymentWithIncomeItem`,`EditIncomeWithSavedRefundLink`,`WithError`,`EmptyOptions`,`MissingAccountAndMerchant`,`MissingMerchant`,`MissingAccount`]}))();export{T as AddPaymentWithIncomeItem,x as CustomDateTime,y as Default,C as EditIncomeMode,D as EditIncomeWithSavedRefundLink,S as EditMode,k as EmptyOptions,N as MissingAccount,j as MissingAccountAndMerchant,M as MissingMerchant,w as MultiAccountPayment,O as WithError,b as WithTags,P as __namedExportsOrder,v as default};