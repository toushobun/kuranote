import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{i as n,r}from"./AccountStep-BSoaGcF4.js";import{n as i,r as a}from"./transactionStepFlow-8icpKE4Y.js";import{i as o,n as s,r as c,t as l}from"./TransactionStepFlow-Dr9qVsPL.js";import{a as u,n as d,o as f,r as p,t as m}from"./transactionReceipt-QP1e34cw.js";import{n as h,t as g}from"./useTransactionForm-2J-Unm7q.js";function _({itemsOptions:e,note:t,automaticItemIds:n=[]}){let r={items:e.initialItems??[],merchantId:`seven`,note:t,payments:e.initialPayments??[{accountId:`paypay`,amount:null}],transactionAt:``,type:`expense`},a=h({accountOptions:i.accounts,categoryOptions:e.categoryOptions,initialValues:r,merchantOptions:i.merchants});return(0,v.jsx)(c,{...e,readOnly:!0,form:a,accountOptions:i.accounts,automaticItemIds:n,amountItemId:null,onAmountItemChange:()=>{},action:()=>{},saving:!1,onBack:()=>{},onAccountSelect:()=>{},onAddAccount:()=>{}})}var v,y=e((()=>{v=t(),o(),g(),a(),_.__docgenInfo={description:`只读小票（#962）的测试 / Storybook 外壳：已选 7-Eleven，明细与付款按参数预填。`,methods:[],displayName:`ReadOnlyReceipt`,props:{itemsOptions:{required:!0,tsType:{name:`ItemsStepOptions`},description:``},note:{required:!0,tsType:{name:`string`},description:``},automaticItemIds:{required:!1,tsType:{name:`Array`,elements:[{name:`number`}],raw:`number[]`},description:``,defaultValue:{value:`[]`,computed:!1}}}}}));function b(e,t){return C.click(w(e.ownerDocument.body).getByRole(`button`,{name:t}))}var x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W;e((()=>{x=t(),s(),r(),a(),y(),m(),{expect:S,userEvent:C,within:w}=__STORYBOOK_MODULE_TEST__,T={title:`Organisms/Transactions/TransactionConfirmStep`,component:l,decorators:n,args:{...i,...p,itemsOptions:{...p.itemsOptions,...d}},parameters:{viewport:{defaultViewport:`mobile2`}}},E={name:`快速路线：自动明细待输入（设计图 8 ②）`,args:{initialAccountId:void 0,suggestionsMerchantId:`seven`,suggestions:{...u,recommendedAccountIds:[`paypay`]},itemsOptions:d}},D={name:`第一次去的商家：选择收支账户（设计图 8 ③）`,args:{initialMerchantId:`coffee`,initialAccountId:void 0,suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]},itemsOptions:d}},O={name:`多账户已对上（设计图 8 ④）`,args:{initialMerchantId:`life`,itemsOptions:{...d,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`2000`}],initialPayments:f}}},k={name:`多账户未对上（差额、禁用保存）`,args:{...O.args,itemsOptions:{...d,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`1500`}],initialPayments:f}}},A={name:`单账户（已填金额、空备注）`},j={name:`明细两排：首排名称与操作、次排待报销`,args:{itemsOptions:{...d,initialItems:[{categoryId:`lunch`,amount:`1200`,specialStatus:`pendingReimbursement`},{categoryId:`points`,amount:`100`}]}}},M=[{categoryId:`lunch`,amount:`10000`,businessNetAmount:`5000`,refundedAmount:`3000`,reimbursementAmount:`2000`}],N={name:`被其他记录退款 / 报销：合计显示净额与已退款、已报销`,args:{itemsOptions:{...d,initialItems:M}}},P={name:`只读（#962）：没有铅笔、×、可点金额与保存按钮`,render:()=>(0,x.jsx)(_,{itemsOptions:{...d,initialItems:[...M,{categoryId:`points`,amount:`100`}]},note:`退了一部分，剩下的公司报销`})},F={name:`支付行铅笔：账户选择抽屉`,play:({canvasElement:e})=>b(e,`更换支付账户 1`)},I={name:`换成不同币种的账户：确认框在抽屉之上`,play:async({canvasElement:e})=>{await b(e,`更换支付账户 1`),await C.click(await w(e.ownerDocument.body).findByRole(`radio`,{name:`招商银行卡 CNY`}))}},L={name:`明细两排：首排真实金额、次排小数位超出提示`,args:{itemsOptions:{...d,initialItems:[{categoryId:`lunch`,amount:`12.55`},{categoryId:`storage`,amount:`2000`}]}}},R={name:`多账户：点金额打开金额键盘（输入中小票金额不变）`,args:k.args,play:async({canvasElement:e})=>{let t=w(e.ownerDocument.body);await b(e,`修改支付账户 2 金额：¥3,000`);let n=await t.findByLabelText(`金额计算器`);await C.click(w(n).getByRole(`button`,{name:`清空`})),await C.click(w(n).getByRole(`button`,{name:`5`})),await S(t.getByRole(`button`,{name:`修改支付账户 2 金额：¥3,000`,hidden:!0})).toBeInTheDocument()}},z={name:`编辑备注`,play:async({canvasElement:e})=>{await b(e,/^修改备注：/),await C.type(w(e.ownerDocument.body).getByRole(`textbox`,{name:`备注`}),`和同事一起吃的午饭`)}},B={name:`编辑时间（日期展开、时刻保留秒）`,play:({canvasElement:e})=>b(e,/^修改时间：/)},V={name:`保存失败`,args:{action:async()=>({error:`保存失败，请稍后重试。`})},play:({canvasElement:e})=>b(e,`保存记账`)},H={name:`保存中`,args:{action:async()=>new Promise(()=>{})},play:V.play},U={name:`小票关闭时确认`,play:({canvasElement:e})=>b(e,`关闭记账`)},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "快速路线：自动明细待输入（设计图 8 ②）",
  args: {
    initialAccountId: undefined,
    suggestionsMerchantId: "seven",
    suggestions: {
      ...receiptSuggestions,
      recommendedAccountIds: ["paypay"]
    },
    itemsOptions: receiptItemsOptions
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "第一次去的商家：选择收支账户（设计图 8 ③）",
  args: {
    initialMerchantId: "coffee",
    initialAccountId: undefined,
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: []
    },
    itemsOptions: receiptItemsOptions
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "多账户已对上（设计图 8 ④）",
  args: {
    initialMerchantId: "life",
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "8000"
      }, {
        categoryId: "storage",
        amount: "2000"
      }],
      initialPayments: twoPayments
    }
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "多账户未对上（差额、禁用保存）",
  args: {
    ...MultiAccountBalanced.args,
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "8000"
      }, {
        categoryId: "storage",
        amount: "1500"
      }],
      initialPayments: twoPayments
    }
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "单账户（已填金额、空备注）"
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "明细两排：首排名称与操作、次排待报销",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "1200",
        specialStatus: "pendingReimbursement"
      }, {
        categoryId: "points",
        amount: "100"
      }]
    }
  }
}`,...j.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "被其他记录退款 / 报销：合计显示净额与已退款、已报销",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: offsetItems
    }
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "只读（#962）：没有铅笔、×、可点金额与保存按钮",
  render: () => <ReadOnlyReceipt itemsOptions={{
    ...receiptItemsOptions,
    initialItems: [...offsetItems, {
      categoryId: "points",
      amount: "100"
    }]
  }} note="退了一部分，剩下的公司报销" />
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "支付行铅笔：账户选择抽屉",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "更换支付账户 1")
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "换成不同币种的账户：确认框在抽屉之上",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, "更换支付账户 1");
    await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("radio", {
      name: "招商银行卡 CNY"
    }));
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "明细两排：首排真实金额、次排小数位超出提示",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      // ฿12.55 换成 JPY 账户后金额不换算，保留 12.55。
      initialItems: [{
        categoryId: "lunch",
        amount: "12.55"
      }, {
        categoryId: "storage",
        amount: "2000"
      }]
    }
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "多账户：点金额打开金额键盘（输入中小票金额不变）",
  args: MultiAccountUnbalanced.args,
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await clickButton(canvasElement, "修改支付账户 2 金额：¥3,000");
    const keypad = await body.findByLabelText("金额计算器");
    await userEvent.click(within(keypad).getByRole("button", {
      name: "清空"
    }));
    await userEvent.click(within(keypad).getByRole("button", {
      name: "5"
    }));
    // 键盘里只是草稿，点「确定」前小票上的金额不变。
    await expect(body.getByRole("button", {
      name: "修改支付账户 2 金额：¥3,000",
      hidden: true
    })).toBeInTheDocument();
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "编辑备注",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, /^修改备注：/);
    await userEvent.type(within(canvasElement.ownerDocument.body).getByRole("textbox", {
      name: "备注"
    }), "和同事一起吃的午饭");
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "编辑时间（日期展开、时刻保留秒）",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, /^修改时间：/)
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "保存失败",
  args: {
    action: async () => ({
      error: "保存失败，请稍后重试。"
    })
  },
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "保存记账")
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    action: async () => new Promise(() => {})
  },
  play: SaveError.play
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "小票关闭时确认",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "关闭记账")
}`,...U.parameters?.docs?.source}}},W=[`QuickEntry`,`FirstVisit`,`MultiAccountBalanced`,`MultiAccountUnbalanced`,`SingleAccount`,`ItemTags`,`OffsetNetTotal`,`ReadOnly`,`AccountPicker`,`CurrencyConfirm`,`ExcessDecimals`,`PaymentAmountKeypad`,`NoteEditor`,`TimeEditor`,`SaveError`,`Saving`,`Abandon`]}))();export{U as Abandon,F as AccountPicker,I as CurrencyConfirm,L as ExcessDecimals,D as FirstVisit,j as ItemTags,O as MultiAccountBalanced,k as MultiAccountUnbalanced,z as NoteEditor,N as OffsetNetTotal,R as PaymentAmountKeypad,E as QuickEntry,P as ReadOnly,V as SaveError,H as Saving,A as SingleAccount,B as TimeEditor,W as __namedExportsOrder,T as default};