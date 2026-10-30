import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,r as n}from"./AccountStep-BNewibG3.js";import{n as r,r as i}from"./transactionStepFlow-8icpKE4Y.js";import{n as a,t as o}from"./TransactionStepFlow-CwStCVta.js";import{a as s,n as c,o as l,r as u,t as d}from"./transactionReceipt-Cio3X-ic.js";function f(e,t){return m.click(h(e.ownerDocument.body).getByRole(`button`,{name:t}))}var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M;e((()=>{a(),n(),i(),d(),{expect:p,userEvent:m,within:h}=__STORYBOOK_MODULE_TEST__,g={title:`Organisms/Transactions/TransactionConfirmStep`,component:o,decorators:t,args:{...r,...u,itemsOptions:{...u.itemsOptions,...c}},parameters:{viewport:{defaultViewport:`mobile2`}}},_={name:`快速路线：自动明细待输入（设计图 8 ②）`,args:{initialAccountId:void 0,suggestionsMerchantId:`seven`,suggestions:{...s,recommendedAccountIds:[`paypay`]},itemsOptions:c}},v={name:`第一次去的商家：选择收支账户（设计图 8 ③）`,args:{initialMerchantId:`coffee`,initialAccountId:void 0,suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]},itemsOptions:c}},y={name:`多账户已对上（设计图 8 ④）`,args:{initialMerchantId:`life`,itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`2000`}],initialPayments:l}}},b={name:`多账户未对上（差额、禁用保存）`,args:{...y.args,itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`1500`}],initialPayments:l}}},x={name:`单账户（已填金额、空备注）`},S={name:`明细两排：首排名称与操作、次排待报销`,args:{itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`1200`,specialStatus:`pendingReimbursement`},{categoryId:`points`,amount:`100`}]}}},C={name:`支付行铅笔：账户选择抽屉`,play:({canvasElement:e})=>f(e,`更换支付账户 1`)},w={name:`换成不同币种的账户：确认框在抽屉之上`,play:async({canvasElement:e})=>{await f(e,`更换支付账户 1`),await m.click(await h(e.ownerDocument.body).findByRole(`radio`,{name:`招商银行卡 CNY`}))}},T={name:`明细两排：首排真实金额、次排小数位超出提示`,args:{itemsOptions:{...c,initialItems:[{categoryId:`lunch`,amount:`12.55`},{categoryId:`storage`,amount:`2000`}]}}},E={name:`多账户：点金额打开金额键盘（输入中小票金额不变）`,args:b.args,play:async({canvasElement:e})=>{let t=h(e.ownerDocument.body);await f(e,`修改支付账户 2 金额：¥3,000`);let n=await t.findByLabelText(`金额计算器`);await m.click(h(n).getByRole(`button`,{name:`清空`})),await m.click(h(n).getByRole(`button`,{name:`5`})),await p(t.getByRole(`button`,{name:`修改支付账户 2 金额：¥3,000`,hidden:!0})).toBeInTheDocument()}},D={name:`编辑备注`,play:async({canvasElement:e})=>{await f(e,/^修改备注：/),await m.type(h(e.ownerDocument.body).getByRole(`textbox`,{name:`备注`}),`和同事一起吃的午饭`)}},O={name:`编辑时间（日期展开、时刻保留秒）`,play:({canvasElement:e})=>f(e,/^修改时间：/)},k={name:`保存失败`,args:{action:async()=>({error:`保存失败，请稍后重试。`})},play:({canvasElement:e})=>f(e,`保存记账`)},A={name:`保存中`,args:{action:async()=>new Promise(()=>{})},play:k.play},j={name:`小票关闭时确认`,play:({canvasElement:e})=>f(e,`关闭记账`)},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "单账户（已填金额、空备注）"
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "支付行铅笔：账户选择抽屉",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "更换支付账户 1")
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "换成不同币种的账户：确认框在抽屉之上",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, "更换支付账户 1");
    await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("radio", {
      name: "招商银行卡 CNY"
    }));
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "编辑备注",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, /^修改备注：/);
    await userEvent.type(within(canvasElement.ownerDocument.body).getByRole("textbox", {
      name: "备注"
    }), "和同事一起吃的午饭");
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "编辑时间（日期展开、时刻保留秒）",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, /^修改时间：/)
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "保存失败",
  args: {
    action: async () => ({
      error: "保存失败，请稍后重试。"
    })
  },
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "保存记账")
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    action: async () => new Promise(() => {})
  },
  play: SaveError.play
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "小票关闭时确认",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "关闭记账")
}`,...j.parameters?.docs?.source}}},M=[`QuickEntry`,`FirstVisit`,`MultiAccountBalanced`,`MultiAccountUnbalanced`,`SingleAccount`,`ItemTags`,`AccountPicker`,`CurrencyConfirm`,`ExcessDecimals`,`PaymentAmountKeypad`,`NoteEditor`,`TimeEditor`,`SaveError`,`Saving`,`Abandon`]}))();export{j as Abandon,C as AccountPicker,w as CurrencyConfirm,T as ExcessDecimals,v as FirstVisit,S as ItemTags,y as MultiAccountBalanced,b as MultiAccountUnbalanced,D as NoteEditor,E as PaymentAmountKeypad,_ as QuickEntry,k as SaveError,A as Saving,x as SingleAccount,O as TimeEditor,M as __namedExportsOrder,g as default};