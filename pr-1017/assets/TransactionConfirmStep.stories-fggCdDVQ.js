import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{a as n,r}from"./AccountStep-ofvjdqbI.js";import{n as i,r as a}from"./transactionStepFlow-jHa4zbU7.js";import{a as o,o as s}from"./useReceiptMerchantPicker-DPlYaIn1.js";import{a as c,n as l,o as u,r as d,t as f}from"./transactionReceipt-0G5_ebr-.js";import{n as p,t as m}from"./useTransactionForm-B-87AMc3.js";import{n as h,t as g}from"./TransactionStepFlow-Cq7FwrCM.js";function _({itemsOptions:e,note:t,automaticItemIds:n=[]}){let r={items:e.initialItems??[],merchantId:`seven`,note:t,payments:e.initialPayments??[{accountId:`paypay`,amount:null}],transactionAt:``,type:`expense`},a=p({accountOptions:i.accounts,categoryOptions:e.categoryOptions,initialValues:r,merchantOptions:i.merchants});return(0,v.jsx)(o,{...e,readOnly:!0,form:a,accountOptions:i.accounts,automaticItemIds:n,amountItemId:null,onAmountItemChange:()=>{},action:()=>{},saving:!1,onMerchantClick:()=>{},onAccountSelect:()=>{}})}var v,y=e((()=>{v=t(),s(),m(),a(),_.__docgenInfo={description:`只读小票（#962）的测试 / Storybook 外壳：已选 7-Eleven，明细与付款按参数预填。`,methods:[],displayName:`ReadOnlyReceipt`,props:{itemsOptions:{required:!0,tsType:{name:`ItemsStepOptions`},description:``},note:{required:!0,tsType:{name:`string`},description:``},automaticItemIds:{required:!1,tsType:{name:`Array`,elements:[{name:`number`}],raw:`number[]`},description:``,defaultValue:{value:`[]`,computed:!1}}}}}));async function b(e,t=`7-Eleven`){let n=T(e.ownerDocument.body);n.queryByRole(`textbox`,{name:`搜索商家`})&&(await w.click(n.getByRole(`button`,{name:t})),await n.findByRole(`button`,{name:`更换支付账户 1`}))}async function x(e,t){return await b(e),w.click(T(e.ownerDocument.body).getByRole(`button`,{name:t}))}var S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K;e((()=>{S=t(),h(),r(),a(),y(),f(),{expect:C,userEvent:w,within:T}=__STORYBOOK_MODULE_TEST__,E={title:`Organisms/Transactions/TransactionConfirmStep`,component:g,decorators:n,args:{...i,...d,itemsOptions:{...d.itemsOptions,...l}},render:e=>(0,S.jsx)(g,{...e,itemsOptions:{...e.itemsOptions,categoryOptions:e.itemsOptions?.categoryOptions??[],initialPayments:e.itemsOptions?.initialPayments??d.itemsOptions?.initialPayments}}),play:({canvasElement:e})=>b(e),parameters:{viewport:{defaultViewport:`mobile2`}}},D={name:`快速路线：自动明细待输入（设计图 8 ②）`,args:{suggestionsMerchantId:`seven`,suggestions:{...c,recommendedAccountIds:[`paypay`]},itemsOptions:l}},O={play:({canvasElement:e})=>b(e,`星巴克`),name:`第一次去的商家：选择收支账户（设计图 8 ③）`,args:{suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]},itemsOptions:{...l,initialPayments:[{accountId:``,amount:null}]}}},k={name:`第一次去的商家：尝试保存后显示校验提示`,args:O.args,play:async({canvasElement:e})=>{await b(e,`星巴克`),await w.click(T(e.ownerDocument.body).getByRole(`button`,{name:`保存记账`}))}},A={name:`多账户已对上（设计图 8 ④）`,args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`2000`}],initialPayments:u}}},j={name:`多账户未对上（差额、保存时提示）`,args:{...A.args,itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`1500`}],initialPayments:u}}},M={name:`单账户（已填金额、空备注）`},N={name:`明细两排：首排名称与操作、次排待报销`,args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`1200`,specialStatus:`pendingReimbursement`},{categoryId:`points`,amount:`100`}]}}},P=[{categoryId:`lunch`,amount:`10000`,businessNetAmount:`5000`,refundedAmount:`3000`,reimbursementAmount:`2000`}],F={name:`被其他记录退款 / 报销：合计显示净额与已退款、已报销`,args:{itemsOptions:{...l,initialItems:P}}},I={name:`只读（#962）：没有铅笔、×、可点金额与保存按钮`,render:()=>(0,S.jsx)(_,{itemsOptions:{...l,initialItems:[...P,{categoryId:`points`,amount:`100`}]},note:`退了一部分，剩下的公司报销`})},L={name:`支付行铅笔：账户选择抽屉`,play:({canvasElement:e})=>x(e,`更换支付账户 1`)},R={name:`换成不同币种的账户：确认框在抽屉之上`,play:async({canvasElement:e})=>{await x(e,`更换支付账户 1`),await w.click(await T(e.ownerDocument.body).findByRole(`radio`,{name:`招商银行卡 CNY`}))}},z={name:`明细两排：首排真实金额、次排小数位超出提示`,args:{itemsOptions:{...l,initialItems:[{categoryId:`lunch`,amount:`12.55`},{categoryId:`storage`,amount:`2000`}]}}},B={name:`多账户：点金额打开金额键盘（输入中小票金额不变）`,args:j.args,play:async({canvasElement:e})=>{let t=T(e.ownerDocument.body);await x(e,`修改支付账户 2 金额：¥3,000`);let n=await t.findByLabelText(`金额计算器`);await w.click(T(n).getByRole(`button`,{name:`清空`})),await w.click(T(n).getByRole(`button`,{name:`5`})),await C(t.getByRole(`button`,{name:`修改支付账户 2 金额：¥3,000`,hidden:!0})).toBeInTheDocument()}},V={name:`编辑备注`,play:async({canvasElement:e})=>{await x(e,/^修改备注：/),await w.type(T(e.ownerDocument.body).getByRole(`textbox`,{name:`备注`}),`和同事一起吃的午饭`)}},H={name:`编辑时间（日期展开、时刻保留秒）`,play:({canvasElement:e})=>x(e,/^修改时间：/)},U={name:`保存失败`,args:{action:async()=>({error:`保存失败，请稍后重试。`})},play:({canvasElement:e})=>x(e,`保存记账`)},W={name:`保存中`,args:{action:async()=>new Promise(()=>{})},play:U.play},G={name:`小票修改后关闭确认（保存并退出）`,play:async({canvasElement:e})=>{await x(e,/^修改备注：/);let t=T(e.ownerDocument.body);await w.type(t.getByRole(`textbox`,{name:`备注`}),`临时备注`),await w.click(t.getByRole(`button`,{name:`完成`})),await w.click(await t.findByRole(`button`,{name:`关闭记账`}))}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "快速路线：自动明细待输入（设计图 8 ②）",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: {
      ...receiptSuggestions,
      recommendedAccountIds: ["paypay"]
    },
    itemsOptions: receiptItemsOptions
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  play: ({
    canvasElement
  }) => enterReceipt(canvasElement, "星巴克"),
  name: "第一次去的商家：选择收支账户（设计图 8 ③）",
  args: {
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: []
    },
    itemsOptions: {
      ...receiptItemsOptions,
      initialPayments: [{
        accountId: "",
        amount: null
      }]
    }
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "第一次去的商家：尝试保存后显示校验提示",
  args: FirstVisit.args,
  play: async ({
    canvasElement
  }) => {
    await enterReceipt(canvasElement, "星巴克");
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "保存记账"
    }));
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "多账户已对上（设计图 8 ④）",
  args: {
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
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "多账户未对上（差额、保存时提示）",
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
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "单账户（已填金额、空备注）"
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
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
}`,...N.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "被其他记录退款 / 报销：合计显示净额与已退款、已报销",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: offsetItems
    }
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "只读（#962）：没有铅笔、×、可点金额与保存按钮",
  render: () => <ReadOnlyReceipt itemsOptions={{
    ...receiptItemsOptions,
    initialItems: [...offsetItems, {
      categoryId: "points",
      amount: "100"
    }]
  }} note="退了一部分，剩下的公司报销" />
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "支付行铅笔：账户选择抽屉",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "更换支付账户 1")
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "换成不同币种的账户：确认框在抽屉之上",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, "更换支付账户 1");
    await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("radio", {
      name: "招商银行卡 CNY"
    }));
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
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
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "编辑备注",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, /^修改备注：/);
    await userEvent.type(within(canvasElement.ownerDocument.body).getByRole("textbox", {
      name: "备注"
    }), "和同事一起吃的午饭");
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "编辑时间（日期展开、时刻保留秒）",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, /^修改时间：/)
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "保存失败",
  args: {
    action: async () => ({
      error: "保存失败，请稍后重试。"
    })
  },
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "保存记账")
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    action: async () => new Promise(() => {})
  },
  play: SaveError.play
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "小票修改后关闭确认（保存并退出）",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, /^修改备注：/);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(body.getByRole("textbox", {
      name: "备注"
    }), "临时备注");
    await userEvent.click(body.getByRole("button", {
      name: "完成"
    }));
    await userEvent.click(await body.findByRole("button", {
      name: "关闭记账"
    }));
  }
}`,...G.parameters?.docs?.source}}},K=[`QuickEntry`,`FirstVisit`,`FirstVisitAfterSave`,`MultiAccountBalanced`,`MultiAccountUnbalanced`,`SingleAccount`,`ItemTags`,`OffsetNetTotal`,`ReadOnly`,`AccountPicker`,`CurrencyConfirm`,`ExcessDecimals`,`PaymentAmountKeypad`,`NoteEditor`,`TimeEditor`,`SaveError`,`Saving`,`Abandon`]}))();export{G as Abandon,L as AccountPicker,R as CurrencyConfirm,z as ExcessDecimals,O as FirstVisit,k as FirstVisitAfterSave,N as ItemTags,A as MultiAccountBalanced,j as MultiAccountUnbalanced,V as NoteEditor,F as OffsetNetTotal,B as PaymentAmountKeypad,D as QuickEntry,I as ReadOnly,U as SaveError,W as Saving,M as SingleAccount,H as TimeEditor,K as __namedExportsOrder,E as default};